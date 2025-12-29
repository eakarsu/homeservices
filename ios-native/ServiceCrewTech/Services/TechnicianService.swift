import Foundation

// MARK: - Technician Service

actor TechnicianService {
    static let shared = TechnicianService()
    private init() {}

    // MARK: - Get Technicians

    func getTechnicians() async throws -> [TechnicianItem] {
        try await APIService.shared.request(endpoint: "/technicians")
    }

    // MARK: - Get Single Technician

    func getTechnician(id: String) async throws -> TechnicianItem {
        try await APIService.shared.request(endpoint: "/technicians/\(id)")
    }

    // MARK: - Update Technician Status

    func updateStatus(id: String, status: String) async throws -> TechnicianItem {
        struct StatusRequest: Encodable {
            let status: String
        }
        return try await APIService.shared.request(
            endpoint: "/technicians/\(id)/status",
            method: .patch,
            body: StatusRequest(status: status)
        )
    }

    // MARK: - Create Technician

    func createTechnician(
        firstName: String,
        lastName: String,
        email: String,
        phone: String?,
        password: String?,
        employeeId: String?,
        tradeTypes: [String],
        certifications: [String]?,
        payType: String,
        hourlyRate: Double?,
        color: String
    ) async throws -> TechnicianItem {
        struct CreateTechnicianRequest: Encodable {
            let firstName: String
            let lastName: String
            let email: String
            let phone: String?
            let password: String?
            let employeeId: String?
            let tradeTypes: [String]
            let certifications: [String]?
            let payType: String
            let hourlyRate: Double?
            let color: String
        }
        return try await APIService.shared.request(
            endpoint: "/technicians",
            method: .post,
            body: CreateTechnicianRequest(
                firstName: firstName,
                lastName: lastName,
                email: email,
                phone: phone,
                password: password,
                employeeId: employeeId,
                tradeTypes: tradeTypes,
                certifications: certifications,
                payType: payType,
                hourlyRate: hourlyRate,
                color: color
            )
        )
    }
}
