import Foundation

// MARK: - Schedule Response Models

struct ScheduleResponse: Decodable {
    let jobs: [ScheduleJob]
    let date: Date
    let totalHours: Double?
}

struct ScheduleJob: Codable, Identifiable {
    let id: String
    let jobNumber: String
    let title: String
    let scheduledStart: Date?
    let scheduledEnd: Date?
    let timeWindowStart: String?
    let timeWindowEnd: String?
    let estimatedDuration: Int?
    let status: String
    let priority: String
    let customerName: String
    let address: String
    let city: String?
    let tradeType: String?
    let latitude: Double?
    let longitude: Double?

    var displayTimeWindow: String {
        if let start = timeWindowStart, let end = timeWindowEnd {
            return "\(start) - \(end)"
        }
        if let scheduledStart = scheduledStart {
            let formatter = DateFormatter()
            formatter.timeStyle = .short
            return formatter.string(from: scheduledStart)
        }
        return "TBD"
    }

    var durationFormatted: String {
        guard let minutes = estimatedDuration else { return "N/A" }
        if minutes < 60 {
            return "\(minutes) min"
        }
        let hours = minutes / 60
        let remainingMinutes = minutes % 60
        return remainingMinutes > 0 ? "\(hours)h \(remainingMinutes)m" : "\(hours)h"
    }
}

struct WeekSchedule: Decodable {
    let weekStart: Date
    let weekEnd: Date
    let days: [DaySchedule]
    let totalJobs: Int
}

struct DaySchedule: Decodable, Identifiable {
    var id: String { date }
    let date: String
    let dayOfWeek: String
    let jobs: [ScheduleJob]
    let totalHours: Double?

    var jobCount: Int { jobs.count }
}

struct TimeSlot: Decodable, Identifiable {
    var id: String { "\(date)-\(time)" }
    let date: String
    let time: String
    let available: Bool
    let jobId: String?
}

// MARK: - Schedule Service

actor ScheduleService {
    static let shared = ScheduleService()
    private init() {}

    // MARK: - Get Schedule

    func getTodaySchedule() async throws -> ScheduleResponse {
        try await getSchedule(date: Date())
    }

    func getSchedule(date: Date) async throws -> ScheduleResponse {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        let queryItems = [URLQueryItem(name: "date", value: formatter.string(from: date))]

        return try await APIService.shared.request(
            endpoint: "/schedule",
            method: .get,
            queryItems: queryItems
        )
    }

    func getWeekSchedule(weekStart: Date? = nil) async throws -> WeekSchedule {
        var queryItems: [URLQueryItem]? = nil

        if let weekStart = weekStart {
            let formatter = ISO8601DateFormatter()
            formatter.formatOptions = [.withFullDate]
            queryItems = [URLQueryItem(name: "weekStart", value: formatter.string(from: weekStart))]
        }

        return try await APIService.shared.request(
            endpoint: "/schedule/week",
            method: .get,
            queryItems: queryItems
        )
    }

    func getMonthSchedule(year: Int, month: Int) async throws -> [DaySchedule] {
        let queryItems = [
            URLQueryItem(name: "year", value: String(year)),
            URLQueryItem(name: "month", value: String(month))
        ]

        return try await APIService.shared.request(
            endpoint: "/schedule/month",
            method: .get,
            queryItems: queryItems
        )
    }

    // MARK: - Availability

    func getAvailableSlots(date: Date, duration: Int = 60) async throws -> [TimeSlot] {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]

        let queryItems = [
            URLQueryItem(name: "date", value: formatter.string(from: date)),
            URLQueryItem(name: "duration", value: String(duration))
        ]

        return try await APIService.shared.request(
            endpoint: "/schedule/available-slots",
            method: .get,
            queryItems: queryItems
        )
    }

    // MARK: - Route Optimization

    func getOptimizedRoute(date: Date) async throws -> [ScheduleJob] {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        let queryItems = [URLQueryItem(name: "date", value: formatter.string(from: date))]

        return try await APIService.shared.request(
            endpoint: "/schedule/optimized-route",
            method: .get,
            queryItems: queryItems
        )
    }

    // MARK: - Refresh

    func refreshSchedule() async throws -> ScheduleResponse {
        try await APIService.shared.request(
            endpoint: "/schedule/refresh",
            method: .post,
            body: EmptyBody()
        )
    }
}
