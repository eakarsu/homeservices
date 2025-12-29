import Foundation

// MARK: - Dispatch Service

actor DispatchService {
    static let shared = DispatchService()
    private init() {}

    // MARK: - Get Technicians with Assignments

    func getTechnicians() async throws -> [DispatchTechnician] {
        try await APIService.shared.request(endpoint: "/dispatch/technicians")
    }

    // MARK: - Get Unassigned Jobs

    func getUnassignedJobs() async throws -> [UnassignedJob] {
        try await APIService.shared.request(endpoint: "/dispatch/unassigned")
    }

    // MARK: - Assign Job to Technician

    func assignJob(jobId: String, technicianId: String) async throws {
        struct AssignRequest: Encodable {
            let jobId: String
            let technicianId: String
        }
        let _: EmptyResponse = try await APIService.shared.request(
            endpoint: "/dispatch/assign",
            method: .post,
            body: AssignRequest(jobId: jobId, technicianId: technicianId)
        )
    }

    // MARK: - AI Optimize Dispatch

    func optimizeDispatch() async throws -> OptimizeResult {
        try await APIService.shared.request(
            endpoint: "/ai/optimize-dispatch",
            method: .post
        )
    }
}

struct OptimizeResult: Decodable {
    let assignments: [AssignmentResult]?
    let warnings: [String]?

    struct AssignmentResult: Decodable {
        let jobId: String
        let technicianId: String
    }
}
