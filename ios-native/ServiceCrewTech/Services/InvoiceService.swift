import Foundation

// MARK: - Response Models

struct InvoicesResponse: Decodable {
    let invoices: [Invoice]
    let total: Int
    let page: Int
    let pageSize: Int
    let totalPages: Int
}

// MARK: - Invoice Service

actor InvoiceService {
    static let shared = InvoiceService()
    private init() {}

    // MARK: - Get Invoices

    func getInvoices(status: String? = nil, search: String? = nil, page: Int = 1, pageSize: Int = 20) async throws -> InvoicesResponse {
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
            endpoint: "/invoices",
            method: .get,
            queryItems: queryItems
        )
    }

    // MARK: - Get Single Invoice

    func getInvoice(id: String) async throws -> Invoice {
        try await APIService.shared.request(endpoint: "/invoices/\(id)")
    }

    // MARK: - Create Invoice

    func createInvoice(
        customerId: String,
        dueDate: Date,
        taxRate: Double,
        notes: String?,
        terms: String?,
        lineItems: [InvoiceLineItemInput]
    ) async throws -> Invoice {
        struct LineItemRequest: Encodable {
            let description: String
            let category: String
            let quantity: Double
            let unitPrice: Double
            let totalPrice: Double
        }
        struct CreateRequest: Encodable {
            let customerId: String
            let dueDate: Date
            let taxRate: Double
            let notes: String?
            let terms: String?
            let lineItems: [LineItemRequest]
        }
        return try await APIService.shared.request(
            endpoint: "/invoices",
            method: .post,
            body: CreateRequest(
                customerId: customerId,
                dueDate: dueDate,
                taxRate: taxRate,
                notes: notes,
                terms: terms,
                lineItems: lineItems.map {
                    LineItemRequest(
                        description: $0.description,
                        category: $0.category,
                        quantity: $0.quantity,
                        unitPrice: $0.unitPrice,
                        totalPrice: $0.quantity * $0.unitPrice
                    )
                }
            )
        )
    }

    // MARK: - Update Invoice Status

    func updateInvoiceStatus(id: String, status: String) async throws -> Invoice {
        struct UpdateRequest: Encodable {
            let status: String
        }
        return try await APIService.shared.request(
            endpoint: "/invoices/\(id)",
            method: .put,
            body: UpdateRequest(status: status)
        )
    }

    // MARK: - Send Invoice

    func sendInvoice(id: String, email: String) async throws {
        struct SendRequest: Encodable {
            let email: String
        }
        let _: EmptyResponse = try await APIService.shared.request(
            endpoint: "/invoices/\(id)/send",
            method: .post,
            body: SendRequest(email: email)
        )
    }

    // MARK: - Record Payment

    func recordPayment(invoiceId: String, amount: Double, paymentMethod: String, reference: String?) async throws -> Invoice {
        struct PaymentRequest: Encodable {
            let amount: Double
            let paymentMethod: String
            let reference: String?
        }
        return try await APIService.shared.request(
            endpoint: "/invoices/\(invoiceId)/payments",
            method: .post,
            body: PaymentRequest(amount: amount, paymentMethod: paymentMethod, reference: reference)
        )
    }
}
