import Foundation

// MARK: - API Service

class APIService {
    static let shared = APIService()

    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    // Configure your API base URL here
    private var baseURL: String {
        // Use environment variable or configuration
        ProcessInfo.processInfo.environment["API_BASE_URL"] ?? "https://app.servicecrewai.com/api"
    }

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 60
        session = URLSession(configuration: config)

        decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        decoder.keyDecodingStrategy = .convertFromSnakeCase

        encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.keyEncodingStrategy = .convertToSnakeCase
    }

    // MARK: - Generic Request Method

    func request<T: Decodable>(
        endpoint: String,
        method: HTTPMethod = .get,
        body: Encodable? = nil,
        queryItems: [URLQueryItem]? = nil
    ) async throws -> T {
        guard var urlComponents = URLComponents(string: "\(baseURL)\(endpoint)") else {
            throw APIError(message: "Invalid URL", code: "INVALID_URL", statusCode: nil)
        }

        if let queryItems = queryItems {
            urlComponents.queryItems = queryItems
        }

        guard let url = urlComponents.url else {
            throw APIError(message: "Invalid URL", code: "INVALID_URL", statusCode: nil)
        }

        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        // Add auth token if available
        if let token = AuthManager.shared.token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body = body {
            request.httpBody = try encoder.encode(body)
        }

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError(message: "Invalid response", code: "INVALID_RESPONSE", statusCode: nil)
        }

        // Handle different status codes
        switch httpResponse.statusCode {
        case 200...299:
            return try decoder.decode(T.self, from: data)
        case 401:
            // Token expired, logout
            await MainActor.run {
                AuthManager.shared.logout()
            }
            throw APIError(message: "Session expired. Please login again.", code: "UNAUTHORIZED", statusCode: 401)
        case 404:
            throw APIError(message: "Resource not found", code: "NOT_FOUND", statusCode: 404)
        case 500...599:
            throw APIError(message: "Server error. Please try again later.", code: "SERVER_ERROR", statusCode: httpResponse.statusCode)
        default:
            // Try to decode error response
            if let apiError = try? decoder.decode(APIError.self, from: data) {
                throw apiError
            }
            throw APIError(message: "Request failed", code: "UNKNOWN", statusCode: httpResponse.statusCode)
        }
    }

    // MARK: - Upload Method

    func upload(
        endpoint: String,
        imageData: Data,
        filename: String,
        mimeType: String = "image/jpeg"
    ) async throws -> JobPhoto {
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            throw APIError(message: "Invalid URL", code: "INVALID_URL", statusCode: nil)
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"

        let boundary = UUID().uuidString
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        if let token = AuthManager.shared.token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        var bodyData = Data()
        bodyData.append("--\(boundary)\r\n".data(using: .utf8)!)
        bodyData.append("Content-Disposition: form-data; name=\"file\"; filename=\"\(filename)\"\r\n".data(using: .utf8)!)
        bodyData.append("Content-Type: \(mimeType)\r\n\r\n".data(using: .utf8)!)
        bodyData.append(imageData)
        bodyData.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)

        request.httpBody = bodyData

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw APIError(message: "Upload failed", code: "UPLOAD_FAILED", statusCode: nil)
        }

        return try decoder.decode(JobPhoto.self, from: data)
    }

    // MARK: - HTTP Methods

    enum HTTPMethod: String {
        case get = "GET"
        case post = "POST"
        case put = "PUT"
        case patch = "PATCH"
        case delete = "DELETE"
    }
}

// MARK: - Job API

extension APIService {
    func getMyJobs(all: Bool = false) async throws -> [Job] {
        let queryItems = all ? [URLQueryItem(name: "all", value: "true")] : nil
        return try await request(endpoint: "/technicians/my-jobs", queryItems: queryItems)
    }

    func getJob(id: String) async throws -> Job {
        return try await request(endpoint: "/jobs/\(id)")
    }

    func updateJobStatus(id: String, status: JobStatus) async throws -> Job {
        struct StatusUpdate: Codable {
            let status: String
        }
        return try await request(
            endpoint: "/jobs/\(id)",
            method: .put,
            body: StatusUpdate(status: status.rawValue)
        )
    }

    func addJobNote(jobId: String, content: String, noteType: String = "TECHNICIAN") async throws -> JobNote {
        struct NoteRequest: Codable {
            let content: String
            let noteType: String
        }
        return try await request(
            endpoint: "/jobs/\(jobId)/notes",
            method: .post,
            body: NoteRequest(content: content, noteType: noteType)
        )
    }

    func uploadJobPhoto(jobId: String, imageData: Data, photoType: JobPhoto.PhotoType) async throws -> JobPhoto {
        let filename = "job_photo_\(Date().timeIntervalSince1970).jpg"
        return try await upload(
            endpoint: "/jobs/\(jobId)/photos?type=\(photoType.rawValue)",
            imageData: imageData,
            filename: filename
        )
    }
}

// MARK: - Auth API

extension APIService {
    func login(email: String, password: String) async throws -> AuthResponse {
        return try await request(
            endpoint: "/auth/login",
            method: .post,
            body: LoginRequest(email: email, password: password)
        )
    }

    func loginWithApple(
        identityToken: String,
        authorizationCode: String,
        userIdentifier: String,
        email: String?,
        fullName: PersonNameComponents?
    ) async throws -> AuthResponse {
        struct AppleLoginRequest: Codable {
            let identityToken: String
            let authorizationCode: String
            let userIdentifier: String
            let email: String?
            let firstName: String?
            let lastName: String?
        }

        return try await request(
            endpoint: "/auth/apple",
            method: .post,
            body: AppleLoginRequest(
                identityToken: identityToken,
                authorizationCode: authorizationCode,
                userIdentifier: userIdentifier,
                email: email,
                firstName: fullName?.givenName,
                lastName: fullName?.familyName
            )
        )
    }

    func getCurrentUser() async throws -> User {
        return try await request(endpoint: "/auth/me")
    }

    func updatePushToken(token: String, platform: String = "ios") async throws -> EmptyResponse {
        struct TokenRequest: Codable {
            let pushToken: String
            let pushPlatform: String
        }
        return try await request(
            endpoint: "/users/push-token",
            method: .post,
            body: TokenRequest(pushToken: token, pushPlatform: platform)
        )
    }
}

// MARK: - Location API

extension APIService {
    func updateLocation(latitude: Double, longitude: Double) async throws -> EmptyResponse {
        struct LocationUpdate: Codable {
            let latitude: Double
            let longitude: Double
        }
        return try await request(
            endpoint: "/technicians/location",
            method: .post,
            body: LocationUpdate(latitude: latitude, longitude: longitude)
        )
    }
}

// MARK: - Inventory API

extension APIService {
    func getInventory() async throws -> [InventoryItem] {
        return try await request(endpoint: "/inventory")
    }
}

// MARK: - AI API

extension APIService {
    func getDiagnostics(equipmentType: String, symptoms: String) async throws -> DiagnosticResult {
        struct DiagnosticRequest: Codable {
            let equipmentType: String
            let symptoms: String
        }
        return try await request(
            endpoint: "/ai/diagnostics",
            method: .post,
            body: DiagnosticRequest(equipmentType: equipmentType, symptoms: symptoms)
        )
    }
}

// MARK: - Support Models

struct EmptyResponse: Codable {}

struct InventoryItem: Identifiable, Codable {
    let id: String
    let name: String
    let sku: String?
    let quantity: Int
    let unitPrice: Double?
    let category: String?
}

struct DiagnosticResult: Codable {
    let possibleCauses: [String]
    let diagnosticSteps: [String]
    let recommendedParts: [String]
    let safetyWarnings: [String]
}
