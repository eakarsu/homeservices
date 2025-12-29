import Foundation

// MARK: - Response Models

struct CustomersResponse: Decodable {
    let data: [Customer]
    let pagination: CustomersPagination?
}

struct CustomersPagination: Decodable {
    let page: Int
    let limit: Int
    let total: Int
    let totalPages: Int
}

struct CustomerDetailResponse: Decodable {
    let customer: Customer
    let properties: [Property]
    let recentJobs: [Job]
    let stats: CustomerStats
}

struct CustomerStats: Decodable {
    let totalJobs: Int
    let completedJobs: Int
    let totalSpent: Double?
    let lastServiceDate: Date?
    let averageRating: Double?
}

// MARK: - Request Models

struct CreateCustomerRequest: Encodable {
    let firstName: String
    let lastName: String
    let email: String?
    let phone: String
    let alternatePhone: String?
    let customerType: String
    let companyName: String?
}

struct CreatePropertyRequest: Encodable {
    let address: String
    let address2: String?
    let city: String
    let state: String
    let zip: String
    let propertyType: String?
    let notes: String?
}

// MARK: - Customer Service

actor CustomerService {
    static let shared = CustomerService()
    private init() {}

    // MARK: - Get Customers

    func getCustomers(search: String? = nil, page: Int = 1, pageSize: Int = 50) async throws -> [Customer] {
        var queryItems = [
            URLQueryItem(name: "page", value: String(page)),
            URLQueryItem(name: "limit", value: String(pageSize))
        ]

        if let search = search, !search.isEmpty {
            queryItems.append(URLQueryItem(name: "search", value: search))
        }

        let response: CustomersResponse = try await APIService.shared.request(
            endpoint: "/customers",
            method: .get,
            queryItems: queryItems
        )
        return response.data
    }

    func createCustomer(
        firstName: String,
        lastName: String,
        companyName: String?,
        email: String?,
        phone: String,
        alternatePhone: String?,
        preferredContact: String,
        source: String,
        address: String,
        city: String,
        state: String,
        zip: String,
        propertyType: String,
        notes: String?
    ) async throws -> Customer {
        struct FullCreateRequest: Encodable {
            let firstName: String
            let lastName: String
            let companyName: String?
            let email: String?
            let phone: String
            let alternatePhone: String?
            let preferredContact: String
            let source: String
            let customerType: String
            let notes: String?
            // Property fields
            let address: String
            let city: String
            let state: String
            let zip: String
            let propertyType: String
        }
        return try await APIService.shared.request(
            endpoint: "/customers",
            method: .post,
            body: FullCreateRequest(
                firstName: firstName,
                lastName: lastName,
                companyName: companyName,
                email: email,
                phone: phone,
                alternatePhone: alternatePhone,
                preferredContact: preferredContact,
                source: source,
                customerType: propertyType == "COMMERCIAL" || propertyType == "INDUSTRIAL" ? "COMMERCIAL" : "RESIDENTIAL",
                notes: notes,
                address: address,
                city: city,
                state: state,
                zip: zip,
                propertyType: propertyType
            )
        )
    }

    func getCustomer(id: String) async throws -> Customer {
        try await APIService.shared.request(endpoint: "/customers/\(id)")
    }

    func getCustomerDetail(id: String) async throws -> CustomerDetailResponse {
        try await APIService.shared.request(endpoint: "/customers/\(id)/detail")
    }

    func searchCustomers(query: String) async throws -> [Customer] {
        let queryItems = [URLQueryItem(name: "q", value: query)]
        return try await APIService.shared.request(
            endpoint: "/customers/search",
            method: .get,
            queryItems: queryItems
        )
    }

    // MARK: - Create/Update Customer

    func createCustomer(_ request: CreateCustomerRequest) async throws -> Customer {
        try await APIService.shared.request(
            endpoint: "/customers",
            method: .post,
            body: request
        )
    }

    func updateCustomer(id: String, _ request: CreateCustomerRequest) async throws -> Customer {
        try await APIService.shared.request(
            endpoint: "/customers/\(id)",
            method: .patch,
            body: request
        )
    }

    // MARK: - Properties

    func getCustomerProperties(customerId: String) async throws -> [Property] {
        try await APIService.shared.request(endpoint: "/customers/\(customerId)/properties")
    }

    func addProperty(customerId: String, _ request: CreatePropertyRequest) async throws -> Property {
        try await APIService.shared.request(
            endpoint: "/customers/\(customerId)/properties",
            method: .post,
            body: request
        )
    }

    func getProperty(id: String) async throws -> Property {
        try await APIService.shared.request(endpoint: "/properties/\(id)")
    }

    func updateProperty(id: String, _ request: CreatePropertyRequest) async throws -> Property {
        try await APIService.shared.request(
            endpoint: "/properties/\(id)",
            method: .patch,
            body: request
        )
    }

    // MARK: - Equipment

    func getPropertyEquipment(propertyId: String) async throws -> [Equipment] {
        try await APIService.shared.request(endpoint: "/properties/\(propertyId)/equipment")
    }

    func addEquipment(propertyId: String, equipment: Equipment) async throws -> Equipment {
        try await APIService.shared.request(
            endpoint: "/properties/\(propertyId)/equipment",
            method: .post,
            body: equipment
        )
    }

    // MARK: - Job History

    func getCustomerJobs(customerId: String, limit: Int = 10) async throws -> [Job] {
        let queryItems = [URLQueryItem(name: "limit", value: String(limit))]
        return try await APIService.shared.request(
            endpoint: "/customers/\(customerId)/jobs",
            method: .get,
            queryItems: queryItems
        )
    }

    func getPropertyJobs(propertyId: String, limit: Int = 10) async throws -> [Job] {
        let queryItems = [URLQueryItem(name: "limit", value: String(limit))]
        return try await APIService.shared.request(
            endpoint: "/properties/\(propertyId)/jobs",
            method: .get,
            queryItems: queryItems
        )
    }
}
