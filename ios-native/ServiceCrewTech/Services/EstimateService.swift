import Foundation

// MARK: - Response Models

struct EstimatesResponse: Decodable {
    let estimates: [Estimate]
    let total: Int
    let page: Int
    let pageSize: Int
    let totalPages: Int
}

// MARK: - Estimate Service

actor EstimateService {
    static let shared = EstimateService()
    private init() {}

    // MARK: - Get Estimates

    func getEstimates(status: String? = nil, search: String? = nil, page: Int = 1, pageSize: Int = 20) async throws -> EstimatesResponse {
        var queryItems = [
            URLQueryItem(name: "page", value: String(page)),
            URLQueryItem(name: "pageSize", value: String(pageSize))
        ]

        if let status = status, !status.isEmpty {
            queryItems.append(URLQueryItem(name: "status", value: status))
        }

        if let search = search, !search.isEmpty {
            queryItems.append(URLQueryItem(name: "search", value: search))
        }

        return try await APIService.shared.request(
            endpoint: "/estimates",
            method: .get,
            queryItems: queryItems
        )
    }

    // MARK: - Get Single Estimate

    func getEstimate(id: String) async throws -> Estimate {
        try await APIService.shared.request(endpoint: "/estimates/\(id)")
    }

    // MARK: - Create Estimate

    func createEstimate(
        customerId: String,
        title: String?,
        taxRate: Double,
        notes: String?,
        terms: String?,
        lineItems: [EstimateLineItemInput]
    ) async throws -> Estimate {
        struct LineItemRequest: Encodable {
            let description: String
            let quantity: Double
            let unitPrice: Double
            let totalPrice: Double
        }
        struct CreateRequest: Encodable {
            let customerId: String
            let title: String?
            let taxRate: Double
            let notes: String?
            let terms: String?
            let lineItems: [LineItemRequest]
        }
        return try await APIService.shared.request(
            endpoint: "/estimates",
            method: .post,
            body: CreateRequest(
                customerId: customerId,
                title: title,
                taxRate: taxRate,
                notes: notes,
                terms: terms,
                lineItems: lineItems.map {
                    LineItemRequest(
                        description: $0.description,
                        quantity: $0.quantity,
                        unitPrice: $0.unitPrice,
                        totalPrice: $0.quantity * $0.unitPrice
                    )
                }
            )
        )
    }

    // MARK: - Update Estimate Status

    func updateEstimateStatus(id: String, status: String) async throws -> Estimate {
        struct UpdateRequest: Encodable {
            let status: String
        }
        return try await APIService.shared.request(
            endpoint: "/estimates/\(id)",
            method: .put,
            body: UpdateRequest(status: status)
        )
    }

    // MARK: - Send Estimate

    func sendEstimate(id: String, email: String) async throws {
        struct SendRequest: Encodable {
            let email: String
        }
        let _: EmptyResponse = try await APIService.shared.request(
            endpoint: "/estimates/\(id)/send",
            method: .post,
            body: SendRequest(email: email)
        )
    }
}
