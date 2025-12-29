import Foundation

// MARK: - Dashboard Response Models

struct DashboardResponse: Decodable {
    let stats: DashboardStats
    let todayJobs: [DashboardJob]
    let alerts: [DashboardAlert]
    let performance: PerformanceStats?
}

struct DashboardStats: Decodable {
    let todayJobs: Int
    let completedToday: Int
    let pendingJobs: Int
    let techniciansAvailable: Int?
    let openEstimates: Int?
    let overdueInvoices: Int?
    let expiringAgreements: Int?
    let revenue: DashboardRevenue?

    // Computed properties for compatibility
    var inProgress: Int { todayJobs - completedToday }
    var weeklyJobs: Int { 0 }
    var monthlyJobs: Int { 0 }
    var completionRate: Double? { todayJobs > 0 ? Double(completedToday) / Double(todayJobs) : nil }
    var averageJobTime: Int? { nil }

    var formattedCompletionRate: String {
        guard let rate = completionRate else { return "N/A" }
        return "\(Int(rate * 100))%"
    }

    var formattedAverageTime: String {
        guard let minutes = averageJobTime else { return "N/A" }
        if minutes < 60 {
            return "\(minutes) min"
        }
        let hours = minutes / 60
        let remainingMinutes = minutes % 60
        return remainingMinutes > 0 ? "\(hours)h \(remainingMinutes)m" : "\(hours)h"
    }
}

struct DashboardRevenue: Decodable {
    private let todayRaw: AnyCodableNumber?
    private let weekRaw: AnyCodableNumber?
    private let monthRaw: AnyCodableNumber?

    var today: Double { todayRaw?.doubleValue ?? 0 }
    var week: Double { weekRaw?.doubleValue ?? 0 }
    var month: Double { monthRaw?.doubleValue ?? 0 }

    private enum CodingKeys: String, CodingKey {
        case todayRaw = "today"
        case weekRaw = "week"
        case monthRaw = "month"
    }
}

struct DashboardJob: Codable, Identifiable {
    let id: String
    let jobNumber: String
    let title: String
    let scheduledStart: Date?
    let timeWindow: String?
    let customerName: String
    let address: String
    let status: String
    let priority: String
    let tradeType: String?
}

struct DashboardAlert: Codable, Identifiable {
    var id: String { type + message }
    let type: String
    let message: String
    let jobId: String?
    let severity: String?

    var alertType: AlertType {
        AlertType(rawValue: type) ?? .info
    }

    enum AlertType: String {
        case urgent = "URGENT"
        case warning = "WARNING"
        case info = "INFO"
        case reminder = "REMINDER"

        var iconName: String {
            switch self {
            case .urgent: return "exclamationmark.triangle.fill"
            case .warning: return "exclamationmark.circle.fill"
            case .info: return "info.circle.fill"
            case .reminder: return "bell.fill"
            }
        }
    }
}

struct PerformanceStats: Decodable {
    let jobsCompleted: Int
    let averageRating: Double?
    let onTimePercentage: Double?
    let customerSatisfaction: Double?
    let partsUsed: Int?
    let revenueGenerated: Double?

    var formattedOnTimePercentage: String {
        guard let percentage = onTimePercentage else { return "N/A" }
        return "\(Int(percentage))%"
    }

    var formattedRevenue: String {
        guard let revenue = revenueGenerated else { return "$0" }
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: revenue)) ?? "$\(revenue)"
    }
}

struct DailySummary: Decodable {
    let totalJobs: Int
    let completedJobs: Int
    let pendingJobs: Int
    let totalRevenue: Double?
    let partsUsed: Int?
    let averageJobDuration: Int?

    var formattedRevenue: String {
        guard let revenue = totalRevenue else { return "$0" }
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: revenue)) ?? "$\(revenue)"
    }
}

struct WeeklyReport: Decodable {
    let weekStart: Date
    let weekEnd: Date
    let totalJobs: Int
    let completedJobs: Int
    let cancelledJobs: Int
    let totalRevenue: Double?
    let jobsByDay: [DailyJobCount]
    let topServices: [ServiceCount]?
}

struct DailyJobCount: Decodable, Identifiable {
    var id: String { date }
    let date: String
    let count: Int
    let completed: Int
}

struct ServiceCount: Decodable, Identifiable {
    var id: String { serviceName }
    let serviceName: String
    let count: Int
    let revenue: Double?
}

// MARK: - Dashboard Service

actor DashboardService {
    static let shared = DashboardService()
    private init() {}

    func getDashboard() async throws -> DashboardResponse {
        // Get stats and jobs in parallel
        async let statsTask: DashboardStats = APIService.shared.request(endpoint: "/dashboard/stats")
        async let jobsTask: JobsResponse = APIService.shared.request(endpoint: "/jobs?limit=10&sort=scheduledStart:asc")

        let (stats, jobsResponse) = try await (statsTask, jobsTask)

        // Convert jobs to dashboard format
        let todayJobs = jobsResponse.jobs.prefix(10).map { job in
            DashboardJob(
                id: job.id,
                jobNumber: job.jobNumber,
                title: job.displayTitle,
                scheduledStart: job.scheduledStart,
                timeWindow: nil,
                customerName: job.customer?.displayName ?? "Unknown",
                address: job.property?.fullAddress ?? "",
                status: job.status.rawValue,
                priority: job.priority.rawValue,
                tradeType: job.tradeType?.rawValue ?? "OTHER"
            )
        }

        return DashboardResponse(
            stats: stats,
            todayJobs: Array(todayJobs),
            alerts: [],
            performance: nil
        )
    }

    func getTechnicianDashboard() async throws -> DashboardResponse {
        try await getDashboard()
    }

    func getDailySummary(date: Date? = nil) async throws -> DailySummary {
        var queryItems: [URLQueryItem]? = nil

        if let date = date {
            let formatter = ISO8601DateFormatter()
            formatter.formatOptions = [.withFullDate]
            queryItems = [URLQueryItem(name: "date", value: formatter.string(from: date))]
        }

        return try await APIService.shared.request(
            endpoint: "/dashboard/daily-summary",
            method: .get,
            queryItems: queryItems
        )
    }

    func getWeeklyReport(weekStart: Date? = nil) async throws -> WeeklyReport {
        var queryItems: [URLQueryItem]? = nil

        if let weekStart = weekStart {
            let formatter = ISO8601DateFormatter()
            formatter.formatOptions = [.withFullDate]
            queryItems = [URLQueryItem(name: "weekStart", value: formatter.string(from: weekStart))]
        }

        return try await APIService.shared.request(
            endpoint: "/dashboard/weekly-report",
            method: .get,
            queryItems: queryItems
        )
    }

    func getPerformanceStats(period: String = "month") async throws -> PerformanceStats {
        let queryItems = [URLQueryItem(name: "period", value: period)]
        return try await APIService.shared.request(
            endpoint: "/dashboard/performance",
            method: .get,
            queryItems: queryItems
        )
    }

    func getAlerts() async throws -> [DashboardAlert] {
        try await APIService.shared.request(endpoint: "/dashboard/alerts")
    }

    func dismissAlert(alertId: String) async throws {
        let _: EmptyResponse = try await APIService.shared.request(
            endpoint: "/dashboard/alerts/\(alertId)/dismiss",
            method: .post,
            body: EmptyBody()
        )
    }
}
