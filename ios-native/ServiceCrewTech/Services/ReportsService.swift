import Foundation

// MARK: - Reports Service

actor ReportsService {
    static let shared = ReportsService()
    private init() {}

    // MARK: - Get Reports

    func getReports(range: String = "month") async throws -> ReportsData {
        let queryItems = [URLQueryItem(name: "range", value: range)]
        return try await APIService.shared.request(
            endpoint: "/reports",
            method: .get,
            queryItems: queryItems
        )
    }
}
