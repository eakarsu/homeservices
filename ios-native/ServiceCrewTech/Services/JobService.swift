import Foundation

// MARK: - Response Models

struct JobsResponse: Decodable {
    let data: [Job]
    let pagination: JobsPagination?

    // Computed property for compatibility
    var jobs: [Job] { data }
}

struct JobsPagination: Decodable {
    let page: Int
    let limit: Int
    let total: Int
    let totalPages: Int
}

struct JobStatsResponse: Decodable {
    let today: Int
    let thisWeek: Int
    let completed: Int
    let inProgress: Int
    let pending: Int
}

// MARK: - Request Models

struct UpdateJobStatusRequest: Encodable {
    let status: String
    let notes: String?
}

struct AddJobNoteRequest: Encodable {
    let content: String
    let noteType: String
}

struct AddLineItemRequest: Encodable {
    let description: String
    let quantity: Double
    let unitPrice: Double
    let itemType: String
}

struct UploadPhotoRequest: Encodable {
    let photoType: String
    let caption: String?
    let latitude: Double?
    let longitude: Double?
}

// MARK: - Job Service

actor JobService {
    static let shared = JobService()
    private init() {}

    // MARK: - Get Jobs

    func getMyJobs(date: Date? = nil, status: JobStatus? = nil) async throws -> [Job] {
        var queryItems: [URLQueryItem] = []

        if let date = date {
            let formatter = ISO8601DateFormatter()
            formatter.formatOptions = [.withFullDate]
            queryItems.append(URLQueryItem(name: "date", value: formatter.string(from: date)))
        }

        if let status = status {
            queryItems.append(URLQueryItem(name: "status", value: status.rawValue))
        }

        return try await APIService.shared.request(
            endpoint: "/jobs/my-jobs",
            method: .get,
            queryItems: queryItems.isEmpty ? nil : queryItems
        )
    }

    func getTodayJobs() async throws -> [Job] {
        try await getMyJobs(date: Date())
    }

    func getUpcomingJobs(limit: Int = 10) async throws -> [Job] {
        let queryItems = [URLQueryItem(name: "limit", value: String(limit))]
        return try await APIService.shared.request(
            endpoint: "/jobs/upcoming",
            method: .get,
            queryItems: queryItems
        )
    }

    func getJob(id: String) async throws -> Job {
        try await APIService.shared.request(endpoint: "/jobs/\(id)")
    }

    func getJobStats() async throws -> JobStatsResponse {
        try await APIService.shared.request(endpoint: "/jobs/stats")
    }

    // MARK: - Create Job

    func createJob(
        customerId: String,
        propertyId: String,
        title: String,
        description: String?,
        tradeType: String,
        jobType: String,
        priority: String,
        scheduledStart: Date,
        timeWindowStart: String?,
        timeWindowEnd: String?,
        estimatedDuration: Int?
    ) async throws -> Job {
        struct CreateJobRequest: Encodable {
            let customerId: String
            let propertyId: String
            let title: String
            let description: String?
            let tradeType: String
            let type: String
            let priority: String
            let scheduledStart: Date
            let timeWindowStart: String?
            let timeWindowEnd: String?
            let estimatedDuration: Int?
        }
        return try await APIService.shared.request(
            endpoint: "/jobs",
            method: .post,
            body: CreateJobRequest(
                customerId: customerId,
                propertyId: propertyId,
                title: title,
                description: description,
                tradeType: tradeType,
                type: jobType,
                priority: priority,
                scheduledStart: scheduledStart,
                timeWindowStart: timeWindowStart,
                timeWindowEnd: timeWindowEnd,
                estimatedDuration: estimatedDuration
            )
        )
    }

    // MARK: - Job Actions

    func startJob(id: String) async throws -> Job {
        try await APIService.shared.request(
            endpoint: "/jobs/\(id)/start",
            method: .post,
            body: EmptyBody()
        )
    }

    func pauseJob(id: String, notes: String? = nil) async throws -> Job {
        try await APIService.shared.request(
            endpoint: "/jobs/\(id)/pause",
            method: .post,
            body: AddJobNoteRequest(content: notes ?? "", noteType: "TECHNICIAN")
        )
    }

    func completeJob(id: String, notes: String? = nil) async throws -> Job {
        try await APIService.shared.request(
            endpoint: "/jobs/\(id)/complete",
            method: .post,
            body: AddJobNoteRequest(content: notes ?? "", noteType: "TECHNICIAN")
        )
    }

    func updateJobStatus(id: String, status: JobStatus, notes: String? = nil) async throws -> Job {
        try await APIService.shared.request(
            endpoint: "/jobs/\(id)/status",
            method: .put,
            body: UpdateJobStatusRequest(status: status.rawValue, notes: notes)
        )
    }

    func markEnRoute(id: String) async throws -> Job {
        try await updateJobStatus(id: id, status: .enRoute)
    }

    func markArrived(id: String) async throws -> Job {
        try await updateJobStatus(id: id, status: .inProgress)
    }

    // MARK: - Notes

    func addNote(jobId: String, content: String, noteType: JobNote.NoteType = .technician) async throws -> JobNote {
        try await APIService.shared.request(
            endpoint: "/jobs/\(jobId)/notes",
            method: .post,
            body: AddJobNoteRequest(content: content, noteType: noteType.rawValue)
        )
    }

    func getNotes(jobId: String) async throws -> [JobNote] {
        try await APIService.shared.request(endpoint: "/jobs/\(jobId)/notes")
    }

    // MARK: - Line Items / Parts

    func addLineItem(jobId: String, description: String, quantity: Double, unitPrice: Double, itemType: LineItem.ItemType) async throws -> LineItem {
        try await APIService.shared.request(
            endpoint: "/jobs/\(jobId)/line-items",
            method: .post,
            body: AddLineItemRequest(
                description: description,
                quantity: quantity,
                unitPrice: unitPrice,
                itemType: itemType.rawValue
            )
        )
    }

    func getLineItems(jobId: String) async throws -> [LineItem] {
        try await APIService.shared.request(endpoint: "/jobs/\(jobId)/line-items")
    }

    func deleteLineItem(jobId: String, lineItemId: String) async throws {
        let _: EmptyResponse = try await APIService.shared.request(
            endpoint: "/jobs/\(jobId)/line-items/\(lineItemId)",
            method: .delete
        )
    }

    // MARK: - Photos

    func uploadPhoto(jobId: String, imageData: Data, photoType: JobPhoto.PhotoType, caption: String? = nil, latitude: Double? = nil, longitude: Double? = nil) async throws -> JobPhoto {
        // This would typically use multipart form data
        // For now, return a placeholder - the actual implementation would need multipart support
        try await APIService.shared.request(
            endpoint: "/jobs/\(jobId)/photos",
            method: .post,
            body: UploadPhotoRequest(
                photoType: photoType.rawValue,
                caption: caption,
                latitude: latitude,
                longitude: longitude
            )
        )
    }

    func getPhotos(jobId: String) async throws -> [JobPhoto] {
        try await APIService.shared.request(endpoint: "/jobs/\(jobId)/photos")
    }

    func deletePhoto(jobId: String, photoId: String) async throws {
        let _: EmptyResponse = try await APIService.shared.request(
            endpoint: "/jobs/\(jobId)/photos/\(photoId)",
            method: .delete
        )
    }

    // MARK: - Search

    func searchJobs(query: String) async throws -> [Job] {
        let queryItems = [URLQueryItem(name: "q", value: query)]
        return try await APIService.shared.request(
            endpoint: "/jobs/search",
            method: .get,
            queryItems: queryItems
        )
    }

    // MARK: - History

    func getJobHistory(customerId: String? = nil, propertyId: String? = nil, limit: Int = 20) async throws -> [Job] {
        var queryItems = [URLQueryItem(name: "limit", value: String(limit))]

        if let customerId = customerId {
            queryItems.append(URLQueryItem(name: "customerId", value: customerId))
        }

        if let propertyId = propertyId {
            queryItems.append(URLQueryItem(name: "propertyId", value: propertyId))
        }

        return try await APIService.shared.request(
            endpoint: "/jobs/history",
            method: .get,
            queryItems: queryItems
        )
    }
}

// MARK: - Empty Body Helper

struct EmptyBody: Encodable {}
