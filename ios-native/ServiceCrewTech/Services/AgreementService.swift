import Foundation

// MARK: - Response Models

struct AgreementsResponse: Decodable {
    let agreements: [ServiceAgreement]
}

// MARK: - Agreement Service

actor AgreementService {
    static let shared = AgreementService()
    private init() {}

    // MARK: - Get Agreements

    func getAgreements(status: String? = nil, search: String? = nil) async throws -> [ServiceAgreement] {
        var queryItems: [URLQueryItem] = []

        if let status = status, !status.isEmpty {
            queryItems.append(URLQueryItem(name: "status", value: status))
        }

        if let search = search, !search.isEmpty {
            queryItems.append(URLQueryItem(name: "search", value: search))
        }

        let response: AgreementsResponse = try await APIService.shared.request(
            endpoint: "/agreements",
            method: .get,
            queryItems: queryItems.isEmpty ? nil : queryItems
        )
        return response.agreements
    }

    // MARK: - Get Single Agreement

    func getAgreement(id: String) async throws -> ServiceAgreement {
        try await APIService.shared.request(endpoint: "/agreements/\(id)")
    }

    // MARK: - Get Plans

    func getPlans() async throws -> [AgreementPlan] {
        try await APIService.shared.request(endpoint: "/agreement-plans")
    }

    // MARK: - Create Agreement

    func createAgreement(
        customerId: String,
        planId: String,
        billingFrequency: String,
        startDate: Date,
        autoRenew: Bool,
        notes: String?
    ) async throws -> ServiceAgreement {
        let endDate = Calendar.current.date(byAdding: .year, value: 1, to: startDate) ?? startDate

        struct CreateRequest: Encodable {
            let customerId: String
            let planId: String
            let billingFrequency: String
            let startDate: Date
            let endDate: Date
            let autoRenew: Bool
            let notes: String?
        }
        return try await APIService.shared.request(
            endpoint: "/agreements",
            method: .post,
            body: CreateRequest(
                customerId: customerId,
                planId: planId,
                billingFrequency: billingFrequency,
                startDate: startDate,
                endDate: endDate,
                autoRenew: autoRenew,
                notes: notes
            )
        )
    }
}
