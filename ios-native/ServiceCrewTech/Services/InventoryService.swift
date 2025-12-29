import Foundation

// MARK: - Inventory Response Models

struct InventoryResponse: Decodable {
    let items: [InventoryItem]
    let pagination: InventoryPagination
}

struct InventoryPagination: Decodable {
    let page: Int
    let limit: Int
    let total: Int
    let totalPages: Int
}

struct InventoryCategory: Decodable, Identifiable {
    var id: String { name }
    let name: String
    let itemCount: Int
    let totalValue: Double?
}

struct TruckInventory: Decodable {
    let truckId: String
    let truckName: String?
    let items: [InventoryItem]
    let lastUpdated: Date?
}

// MARK: - Request Models

struct UpdateInventoryRequest: Encodable {
    let quantity: Int
    let notes: String?
}

struct TransferInventoryRequest: Encodable {
    let itemId: String
    let quantity: Int
    let fromLocation: String
    let toLocation: String
}

struct UsePartsRequest: Encodable {
    let items: [UsedPart]
}

struct UsedPart: Encodable {
    let itemId: String
    let quantity: Int
}

// MARK: - Inventory Service

actor InventoryService {
    static let shared = InventoryService()
    private init() {}

    // MARK: - Get Inventory

    func getInventory(search: String? = nil, category: String? = nil, page: Int = 1, pageSize: Int = 50) async throws -> InventoryResponse {
        var queryItems = [
            URLQueryItem(name: "page", value: String(page)),
            URLQueryItem(name: "limit", value: String(pageSize))
        ]

        if let search = search, !search.isEmpty {
            queryItems.append(URLQueryItem(name: "search", value: search))
        }

        if let category = category, !category.isEmpty {
            queryItems.append(URLQueryItem(name: "category", value: category))
        }

        return try await APIService.shared.request(
            endpoint: "/inventory",
            method: .get,
            queryItems: queryItems
        )
    }

    func getItem(id: String) async throws -> InventoryItem {
        try await APIService.shared.request(endpoint: "/inventory/\(id)")
    }

    // MARK: - Create Part

    func createPart(
        name: String,
        partNumber: String?,
        description: String?,
        category: String,
        cost: Double,
        sellPrice: Double,
        quantity: Int,
        minQuantity: Int?,
        location: String?,
        vendor: String?
    ) async throws -> InventoryItem {
        struct CreatePartRequest: Encodable {
            let name: String
            let sku: String?
            let description: String?
            let category: String
            let unitPrice: Double
            let cost: Double
            let quantity: Int
            let minQuantity: Int?
            let location: String?
            let supplier: String?
        }
        return try await APIService.shared.request(
            endpoint: "/inventory",
            method: .post,
            body: CreatePartRequest(
                name: name,
                sku: partNumber,
                description: description,
                category: category,
                unitPrice: sellPrice,
                cost: cost,
                quantity: quantity,
                minQuantity: minQuantity,
                location: location,
                supplier: vendor
            )
        )
    }

    func searchInventory(query: String) async throws -> [InventoryItem] {
        let queryItems = [URLQueryItem(name: "q", value: query)]
        return try await APIService.shared.request(
            endpoint: "/inventory/search",
            method: .get,
            queryItems: queryItems
        )
    }

    // MARK: - Categories

    func getCategories() async throws -> [InventoryCategory] {
        try await APIService.shared.request(endpoint: "/inventory/categories")
    }

    // MARK: - Truck Inventory

    func getTruckInventory() async throws -> TruckInventory {
        try await APIService.shared.request(endpoint: "/inventory/truck")
    }

    func getMyTruckInventory() async throws -> [InventoryItem] {
        try await APIService.shared.request(endpoint: "/inventory/my-truck")
    }

    // MARK: - Update Inventory

    func updateQuantity(itemId: String, quantity: Int, notes: String? = nil) async throws -> InventoryItem {
        try await APIService.shared.request(
            endpoint: "/inventory/\(itemId)/quantity",
            method: .put,
            body: UpdateInventoryRequest(quantity: quantity, notes: notes)
        )
    }

    func transferInventory(_ request: TransferInventoryRequest) async throws -> InventoryItem {
        try await APIService.shared.request(
            endpoint: "/inventory/transfer",
            method: .post,
            body: request
        )
    }

    // MARK: - Use Parts for Job

    func usePartsForJob(jobId: String, parts: [UsedPart]) async throws {
        let _: EmptyResponse = try await APIService.shared.request(
            endpoint: "/jobs/\(jobId)/use-parts",
            method: .post,
            body: UsePartsRequest(items: parts)
        )
    }

    func returnParts(jobId: String, parts: [UsedPart]) async throws {
        let _: EmptyResponse = try await APIService.shared.request(
            endpoint: "/jobs/\(jobId)/return-parts",
            method: .post,
            body: UsePartsRequest(items: parts)
        )
    }

    // MARK: - Low Stock Alerts

    func getLowStockItems() async throws -> [InventoryItem] {
        try await APIService.shared.request(endpoint: "/inventory/low-stock")
    }

    func requestRestock(itemId: String, quantity: Int) async throws {
        struct RestockRequest: Encodable {
            let quantity: Int
        }

        let _: EmptyResponse = try await APIService.shared.request(
            endpoint: "/inventory/\(itemId)/request-restock",
            method: .post,
            body: RestockRequest(quantity: quantity)
        )
    }
}
