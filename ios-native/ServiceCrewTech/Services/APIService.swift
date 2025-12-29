import Foundation

// MARK: - API Service

class APIService {
    static let shared = APIService()

    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    // Configure your API base URL here
    private var baseURL: String {
        // Use environment variable or production server
        #if DEBUG
        ProcessInfo.processInfo.environment["API_BASE_URL"] ?? "https://servicecrewai.com/api"
        #else
        "https://servicecrewai.com/api"
        #endif
    }

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 60
        session = URLSession(configuration: config)

        decoder = JSONDecoder()
        // Use custom date decoder that handles ISO8601 with milliseconds
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let dateString = try container.decode(String.self)

            // Try ISO8601 with fractional seconds first
            let formatter = ISO8601DateFormatter()
            formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let date = formatter.date(from: dateString) {
                return date
            }

            // Try without fractional seconds
            formatter.formatOptions = [.withInternetDateTime]
            if let date = formatter.date(from: dateString) {
                return date
            }

            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Cannot decode date: \(dateString)")
        }
        // Backend sends camelCase, no conversion needed

        encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        // Do NOT use convertToSnakeCase - backend expects camelCase
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
        if let token = await AuthManager.shared.token {
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

        if let token = await AuthManager.shared.token {
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

// MARK: - Dashboard API

extension APIService {
    func getDashboardStats() async throws -> DashboardStats {
        return try await request(endpoint: "/dashboard/stats")
    }

    func getRecentJobs(limit: Int = 5) async throws -> JobsResponse {
        let queryItems = [
            URLQueryItem(name: "limit", value: String(limit)),
            URLQueryItem(name: "sort", value: "createdAt:desc")
        ]
        return try await request(endpoint: "/jobs", queryItems: queryItems)
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
            endpoint: "/auth/mobile/login",
            method: .post,
            body: LoginRequest(email: email, password: password)
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

    func loginWithApple(
        identityToken: String,
        authorizationCode: String,
        nonce: String,
        userIdentifier: String,
        email: String?,
        firstName: String?,
        lastName: String?
    ) async throws -> AuthResponse {
        let request = AppleAuthRequest(
            identityToken: identityToken,
            authorizationCode: authorizationCode,
            nonce: nonce,
            userIdentifier: userIdentifier,
            email: email,
            firstName: firstName,
            lastName: lastName
        )
        return try await self.request(
            endpoint: "/auth/apple",
            method: .post,
            body: request
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
    // MARK: - AI Chat (General Assistant)
    func aiChat(messages: [(role: String, content: String)]) async throws -> String {
        struct APIMessage: Encodable {
            let role: String
            let content: String
        }
        struct ChatRequest: Encodable {
            let messages: [APIMessage]
        }
        struct ChatResponse: Decodable {
            let success: Bool
            let message: String?
            let error: String?
        }

        let apiMessages = messages.map { APIMessage(role: $0.role, content: $0.content) }
        let response: ChatResponse = try await request(
            endpoint: "/ai/chat",
            method: .post,
            body: ChatRequest(messages: apiMessages)
        )

        if response.success, let message = response.message {
            return message
        } else if let error = response.error {
            throw APIError(message: error, code: nil, statusCode: nil)
        }
        return "Unable to get response"
    }

    // MARK: - AI Diagnostics (uses /ai/diagnostics)
    func getDiagnostics(tradeType: String, symptoms: [String], equipmentType: String?, additionalInfo: String?) async throws -> DiagnosticResult {
        struct DiagnosticRequest: Encodable {
            let tradeType: String
            let symptoms: [String]
            let equipmentType: String?
            let additionalInfo: String?
        }
        return try await request(
            endpoint: "/ai/diagnostics",
            method: .post,
            body: DiagnosticRequest(tradeType: tradeType, symptoms: symptoms, equipmentType: equipmentType, additionalInfo: additionalInfo)
        )
    }

    // MARK: - AI Dispatch Optimizer (uses /ai/optimize-dispatch)
    func aiRouteOptimizer(startLocation: String, priority: String) async throws -> String {
        struct OptimizeRequest: Encodable {
            let optimizeFor: String
        }
        struct Assignment: Decodable {
            let jobNumber: String
            let technicianName: String
            let estimatedTravelTime: Int
            let estimatedArrival: String
            let reason: String
        }
        struct Metrics: Decodable {
            let totalTravelTime: Int
            let avgTravelTime: Int
            let jobsAssigned: Int
            let unassignedJobs: Int
        }
        struct OptimizeResponse: Decodable {
            let assignments: [Assignment]?
            let metrics: Metrics?
            let warnings: [String]?
            let error: String?
        }

        let response: OptimizeResponse = try await request(
            endpoint: "/ai/optimize-dispatch",
            method: .post,
            body: OptimizeRequest(optimizeFor: priority == "HIGH" ? "time" : "balanced")
        )

        if let error = response.error {
            return "Error: \(error)"
        }

        var result = "📊 Dispatch Optimization Results\n\n"
        if let metrics = response.metrics {
            result += "Jobs Assigned: \(metrics.jobsAssigned)\n"
            result += "Unassigned: \(metrics.unassignedJobs)\n"
            result += "Avg Travel Time: \(metrics.avgTravelTime) min\n\n"
        }

        if let assignments = response.assignments, !assignments.isEmpty {
            result += "Assignments:\n"
            for assignment in assignments {
                result += "• \(assignment.jobNumber) → \(assignment.technicianName)\n"
                result += "  ETA: \(assignment.estimatedArrival) (\(assignment.estimatedTravelTime) min)\n"
            }
        } else {
            result += "No jobs to assign at this time."
        }

        if let warnings = response.warnings, !warnings.isEmpty {
            result += "\n⚠️ Warnings:\n"
            for warning in warnings {
                result += "• \(warning)\n"
            }
        }

        return result
    }

    // MARK: - AI Quote Generator (uses /ai/quote-generator)
    func aiQuoteGenerator(service: String, tradeType: String, customerName: String?) async throws -> String {
        let jobDescription = service
        struct QuoteRequest: Encodable {
            let service: String
            let tradeType: String
            let customerName: String
        }
        struct QuoteOption: Decodable {
            let tier: String
            let name: String
            let description: String?
            let laborCost: Double
            let partsCost: Double
            let totalCost: Double
            let warranty: String?
            let estimatedDuration: String?
            let recommended: Bool?
        }
        struct QuoteResponse: Decodable {
            let customerName: String?
            let jobDescription: String?
            let options: [QuoteOption]?
            let validUntil: String?
            let error: String?
        }

        let response: QuoteResponse = try await request(
            endpoint: "/ai/quote-generator",
            method: .post,
            body: QuoteRequest(service: jobDescription, tradeType: tradeType, customerName: "Customer")
        )

        if let error = response.error {
            return "Error: \(error)"
        }

        var result = "💰 Quote Generated\n"
        if let desc = response.jobDescription {
            result += "\(desc)\n\n"
        }

        if let options = response.options {
            for option in options {
                let rec = option.recommended == true ? " ⭐ RECOMMENDED" : ""
                result += "[\(option.tier.uppercased())] \(option.name)\(rec)\n"
                result += "  Labor: $\(String(format: "%.2f", option.laborCost))\n"
                result += "  Parts: $\(String(format: "%.2f", option.partsCost))\n"
                result += "  Total: $\(String(format: "%.2f", option.totalCost))\n"
                if let warranty = option.warranty {
                    result += "  Warranty: \(warranty)\n"
                }
                result += "\n"
            }
        }

        if let valid = response.validUntil {
            result += "Valid until: \(valid)"
        }

        return result
    }

    // MARK: - AI Customer Insights (uses /ai/customer-insights)
    func aiCustomerInsights(customerName: String) async throws -> String {
        struct CustomerData: Encodable {
            let id: String
            let name: String
            let totalSpent: Double
            let jobCount: Int
            let lastServiceDate: String?
            let memberSince: String
        }
        struct InsightsRequest: Encodable {
            let customersData: [CustomerData]
        }
        struct Insight: Decodable {
            let customerName: String?
            let segment: String?
            let churnRisk: String?
            let churnProbability: Int?
            let healthScore: Int?
            let lifetimeValue: Double?
        }
        struct InsightsResponse: Decodable {
            let insights: [Insight]?
            let trends: [String]?
            let error: String?
        }

        // Create sample customer data for analysis
        let customerData = CustomerData(
            id: UUID().uuidString,
            name: customerName,
            totalSpent: 1500,
            jobCount: 5,
            lastServiceDate: nil,
            memberSince: "2024-01-01"
        )

        let response: InsightsResponse = try await request(
            endpoint: "/ai/customer-insights",
            method: .post,
            body: InsightsRequest(customersData: [customerData])
        )

        if let error = response.error {
            return "Error: \(error)"
        }

        guard let insight = response.insights?.first else {
            return "No insights available for \(customerName)"
        }

        var result = "👤 Customer Insights: \(insight.customerName ?? customerName)\n\n"
        if let segment = insight.segment {
            result += "Segment: \(segment)\n"
        }
        if let health = insight.healthScore {
            result += "Health Score: \(health)/100\n"
        }
        if let risk = insight.churnRisk, let prob = insight.churnProbability {
            result += "Churn Risk: \(risk) (\(prob)%)\n"
        }
        if let ltv = insight.lifetimeValue {
            result += "Lifetime Value: $\(String(format: "%.2f", ltv))\n"
        }

        if let trends = response.trends, !trends.isEmpty {
            result += "\n📈 Trends:\n"
            for trend in trends {
                result += "• \(trend)\n"
            }
        }

        return result
    }

    // MARK: - AI Parts Predictor (uses /ai/chat as fallback)
    func aiPartsPredictor(jobDescription: String, tradeType: String) async throws -> String {
        let prompt = "For a \(tradeType) job: \(jobDescription), what parts are typically needed? List the most common parts."
        return try await aiChat(messages: [("user", prompt)])
    }

    // MARK: - AI Safety Advisor (uses /ai/chat as fallback)
    func aiSafetyAdvisor(jobTypes: [String], additionalDetails: String) async throws -> String {
        let prompt = "What are the safety considerations for \(jobTypes.joined(separator: ", ")) work? \(additionalDetails)"
        return try await aiChat(messages: [("user", prompt)])
    }

    // MARK: - AI Message Generator (uses /ai/chat as fallback)
    func aiMessageGenerator(messageType: String, customerName: String, details: String) async throws -> String {
        let prompt = "Write a professional \(messageType) message for customer \(customerName). Details: \(details)"
        return try await aiChat(messages: [("user", prompt)])
    }

    // MARK: - AI Job Summary (uses /ai/job-summary)
    func aiJobSummary(technicianNotes: String, workPerformed: String, timeSpent: Double, partsUsed: String) async throws -> String {
        struct SummaryRequest: Encodable {
            let job: JobInfo?
            let technicianNotes: String
            let workDescription: String
            let timeSpent: Double
            let partsUsedText: String
            let useSampleData: Bool
        }
        struct JobInfo: Encodable {
            let id: String
            let jobNumber: String
            let title: String
            let customerName: String
            let address: String
            let tradeType: String
        }
        struct SummaryResponse: Decodable {
            let summary: String?
            let customerSummary: String?
            let recommendations: [String]?
            let workPerformed: [String]?
            let qualityScore: Int?
            let error: String?
        }

        let sampleJob = JobInfo(
            id: "sample-1",
            jobNumber: "JOB-2024-001",
            title: "Service Call",
            customerName: "Sample Customer",
            address: "123 Main St",
            tradeType: "HVAC"
        )

        let response: SummaryResponse = try await request(
            endpoint: "/ai/job-summary",
            method: .post,
            body: SummaryRequest(
                job: sampleJob,
                technicianNotes: technicianNotes,
                workDescription: workPerformed,
                timeSpent: timeSpent,
                partsUsedText: partsUsed,
                useSampleData: true
            )
        )

        if let error = response.error {
            return "Error: \(error)"
        }

        var result = "Job Summary\n\n"
        if let summary = response.summary {
            result += summary + "\n\n"
        }
        if let score = response.qualityScore {
            result += "Quality Score: \(score)%\n\n"
        }
        if let work = response.workPerformed, !work.isEmpty {
            result += "Work Performed:\n"
            for item in work {
                result += "• \(item)\n"
            }
            result += "\n"
        }
        if let customerSummary = response.customerSummary {
            result += "For Customer:\n\(customerSummary)\n\n"
        }
        if let recs = response.recommendations, !recs.isEmpty {
            result += "Recommendations:\n"
            for rec in recs {
                result += "• \(rec)\n"
            }
        }

        return result
    }

    // MARK: - AI Dispatch Optimizer (uses date)
    func aiDispatchOptimizer(date: Date) async throws -> String {
        struct SampleTechnician: Encodable {
            let id: String
            let name: String
            let status: String
            let currentLocation: Location?
            let assignedJobs: Int
            let skills: [String]
        }
        struct SampleJob: Encodable {
            let id: String
            let jobNumber: String
            let title: String
            let priority: String
            let tradeType: String
            let estimatedDuration: Int
            let customerName: String
            let address: String
            let location: Location?
        }
        struct Location: Encodable {
            let lat: Double
            let lng: Double
        }
        struct OptimizeRequest: Encodable {
            let date: String
            let optimizeFor: String
            let useSampleData: Bool
            let techniciansData: [SampleTechnician]
            let jobsData: [SampleJob]
        }
        struct Assignment: Decodable {
            let jobNumber: String
            let technicianName: String
            let estimatedTravelTime: Int
            let estimatedArrival: String
            let reason: String
        }
        struct Metrics: Decodable {
            let totalTravelTime: Int
            let avgTravelTime: Int
            let jobsAssigned: Int
            let unassignedJobs: Int
        }
        struct OptimizeResponse: Decodable {
            let assignments: [Assignment]?
            let metrics: Metrics?
            let warnings: [String]?
            let error: String?
        }

        // Sample technicians data
        let sampleTechnicians = [
            SampleTechnician(id: "tech-1", name: "Mike Johnson", status: "AVAILABLE", currentLocation: Location(lat: 29.7604, lng: -95.3698), assignedJobs: 1, skills: ["HVAC", "Electrical"]),
            SampleTechnician(id: "tech-2", name: "Sarah Williams", status: "AVAILABLE", currentLocation: Location(lat: 29.7504, lng: -95.3598), assignedJobs: 0, skills: ["Plumbing", "HVAC"]),
            SampleTechnician(id: "tech-3", name: "David Chen", status: "ON_JOB", currentLocation: Location(lat: 29.7404, lng: -95.3498), assignedJobs: 2, skills: ["Electrical", "Appliance"])
        ]

        // Sample jobs data
        let sampleJobs = [
            SampleJob(id: "job-1", jobNumber: "JOB-2024-001", title: "AC Not Cooling", priority: "HIGH", tradeType: "HVAC", estimatedDuration: 90, customerName: "Smith Residence", address: "123 Oak Street, Houston, TX", location: Location(lat: 29.7654, lng: -95.3698)),
            SampleJob(id: "job-2", jobNumber: "JOB-2024-002", title: "Water Heater Leak", priority: "URGENT", tradeType: "Plumbing", estimatedDuration: 60, customerName: "Johnson Home", address: "456 Pine Avenue, Houston, TX", location: Location(lat: 29.7554, lng: -95.3798)),
            SampleJob(id: "job-3", jobNumber: "JOB-2024-003", title: "Electrical Panel Upgrade", priority: "MEDIUM", tradeType: "Electrical", estimatedDuration: 120, customerName: "Williams Office", address: "789 Elm Road, Houston, TX", location: Location(lat: 29.7454, lng: -95.3898)),
            SampleJob(id: "job-4", jobNumber: "JOB-2024-004", title: "Furnace Maintenance", priority: "LOW", tradeType: "HVAC", estimatedDuration: 45, customerName: "Davis Family", address: "321 Maple Drive, Houston, TX", location: Location(lat: 29.7354, lng: -95.3998))
        ]

        let dateFormatter = ISO8601DateFormatter()
        let response: OptimizeResponse = try await request(
            endpoint: "/ai/optimize-dispatch",
            method: .post,
            body: OptimizeRequest(
                date: dateFormatter.string(from: date),
                optimizeFor: "balanced",
                useSampleData: true,
                techniciansData: sampleTechnicians,
                jobsData: sampleJobs
            )
        )

        if let error = response.error {
            return "Error: \(error)"
        }

        var result = "Dispatch Optimization Results\n\n"
        if let metrics = response.metrics {
            result += "Jobs Assigned: \(metrics.jobsAssigned)\n"
            result += "Unassigned: \(metrics.unassignedJobs)\n"
            result += "Avg Travel Time: \(metrics.avgTravelTime) min\n\n"
        }

        if let assignments = response.assignments, !assignments.isEmpty {
            result += "Assignments:\n"
            for assignment in assignments {
                result += "• \(assignment.jobNumber) → \(assignment.technicianName)\n"
                result += "  ETA: \(assignment.estimatedArrival) (\(assignment.estimatedTravelTime) min)\n"
            }
        } else {
            result += "No jobs to assign at this time."
        }

        if let warnings = response.warnings, !warnings.isEmpty {
            result += "\nWarnings:\n"
            for warning in warnings {
                result += "• \(warning)\n"
            }
        }

        return result
    }

    // MARK: - AI Smart Scheduling
    func aiSmartScheduling(customerName: String, serviceType: String, preferredDate: Date, preferredTime: String) async throws -> String {
        struct ScheduleRequest: Encodable {
            let customerData: CustomerData
            let serviceData: ServiceData
            let preferredDate: String
            let preferredTime: String
            let urgency: String
            let useSampleData: Bool
        }
        struct CustomerData: Encodable {
            let id: String
            let name: String
            let address: String
            let preferredTimes: [String]
        }
        struct ServiceData: Encodable {
            let id: String
            let name: String
            let estimatedDuration: Int
            let tradeType: String
        }
        struct Suggestion: Decodable {
            let date: String
            let timeSlot: String
            let technicianName: String
            let score: Int
            let reasons: [String]
            let travelTime: Int
        }
        struct ScheduleResponse: Decodable {
            let suggestions: [Suggestion]?
            let customerPreferenceMatch: Int?
            let error: String?
        }

        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"

        let response: ScheduleResponse = try await request(
            endpoint: "/ai/smart-scheduling",
            method: .post,
            body: ScheduleRequest(
                customerData: CustomerData(
                    id: "sample-1",
                    name: customerName,
                    address: "123 Main St",
                    preferredTimes: [preferredTime.lowercased()]
                ),
                serviceData: ServiceData(
                    id: "svc-1",
                    name: serviceType,
                    estimatedDuration: 90,
                    tradeType: "HVAC"
                ),
                preferredDate: dateFormatter.string(from: preferredDate),
                preferredTime: preferredTime.lowercased(),
                urgency: "normal",
                useSampleData: true
            )
        )

        if let error = response.error {
            return "Error: \(error)"
        }

        var result = "Smart Scheduling Results\n\n"
        if let match = response.customerPreferenceMatch {
            result += "Preference Match: \(match)%\n\n"
        }

        if let suggestions = response.suggestions, !suggestions.isEmpty {
            result += "Recommended Slots:\n\n"
            for (index, suggestion) in suggestions.enumerated() {
                let marker = index == 0 ? " [Best]" : ""
                result += "\(index + 1). \(suggestion.date) - \(suggestion.timeSlot)\(marker)\n"
                result += "   Technician: \(suggestion.technicianName)\n"
                result += "   Score: \(suggestion.score)% | Travel: \(suggestion.travelTime) min\n"
                if !suggestion.reasons.isEmpty {
                    result += "   Reasons: \(suggestion.reasons.joined(separator: ", "))\n"
                }
                result += "\n"
            }
        } else {
            result += "No available slots found for the selected criteria."
        }

        return result
    }

    // MARK: - AI Predictive Maintenance
    func aiPredictiveMaintenance(equipmentType: String, equipmentAge: Int, lastServiceDate: Date, serviceHistory: String) async throws -> String {
        let prompt = """
        Analyze the maintenance needs for this equipment:
        - Type: \(equipmentType)
        - Age: \(equipmentAge) years
        - Service History: \(serviceHistory)

        Predict:
        1. Components likely to fail soon
        2. Recommended maintenance schedule
        3. Cost-saving opportunities
        4. Life expectancy estimate
        """
        return try await aiChat(messages: [("user", prompt)])
    }

    // MARK: - AI Inventory Forecast
    func aiInventoryForecast(tradeCategory: String, forecastPeriod: Int, stockNotes: String) async throws -> String {
        let prompt = """
        Generate an inventory forecast for \(tradeCategory) parts for the next \(forecastPeriod) days.

        Current stock notes: \(stockNotes.isEmpty ? "No specific notes" : stockNotes)

        Provide:
        1. Parts likely to be needed based on seasonal trends
        2. Recommended reorder quantities
        3. Low stock alerts
        4. Cost optimization suggestions
        """
        return try await aiChat(messages: [("user", prompt)])
    }
}

// MARK: - Support Models

struct EmptyResponse: Codable {}

struct InventoryItem: Identifiable, Codable, Hashable {
    let id: String
    let name: String
    let sku: String?
    let description: String?
    let category: String?
    let quantity: Int
    let minQuantity: Int?
    let unitPrice: Double?
    let location: String?
    let supplier: String?
    let lastRestocked: Date?
    let imageUrl: String?

    var isLowStock: Bool {
        guard let minQty = minQuantity else { return false }
        return quantity <= minQty
    }

    var formattedPrice: String {
        guard let price = unitPrice else { return "N/A" }
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: price)) ?? "$\(price)"
    }
}

struct DiagnosticResult: Codable {
    let possibleCauses: [PossibleCause]?
    let recommendedActions: [RecommendedAction]?
    let additionalQuestions: [String]?
    let safetyWarnings: [String]?
    let estimatedRepairCost: RepairCost?

    struct PossibleCause: Codable {
        let cause: String
        let probability: Int
        let explanation: String
    }

    struct RecommendedAction: Codable {
        let action: String
        let priority: String
        let estimatedTime: Int
        let partsNeeded: [String]
    }

    struct RepairCost: Codable {
        let low: Double
        let high: Double
    }
}

