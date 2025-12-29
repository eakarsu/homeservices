import Foundation

// MARK: - Estimate Model

struct Estimate: Identifiable, Codable, Hashable {
    let id: String
    let estimateNumber: String
    let status: EstimateStatus
    let createdDate: Date?
    let expirationDate: Date?
    let approvedAt: Date?
    let selectedOption: String?
    let signatureFile: String?
    let signedBy: String?
    let notes: String?
    let terms: String?
    let createdAt: Date?
    let updatedAt: Date?
    let customerId: String
    let jobId: String?
    let customer: EstimateCustomer?
    let job: EstimateJob?
    let options: [EstimateOption]?

    // Prisma Decimal fields come as strings
    private let subtotalRaw: AnyCodableNumber?
    private let taxAmountRaw: AnyCodableNumber?
    private let totalAmountRaw: AnyCodableNumber?
    private let goodTotalRaw: AnyCodableNumber?
    private let betterTotalRaw: AnyCodableNumber?
    private let bestTotalRaw: AnyCodableNumber?

    var subtotal: Double { subtotalRaw?.doubleValue ?? 0 }
    var taxAmount: Double { taxAmountRaw?.doubleValue ?? 0 }
    var totalAmount: Double { totalAmountRaw?.doubleValue ?? 0 }
    var goodTotal: Double? { goodTotalRaw?.doubleValue }
    var betterTotal: Double? { betterTotalRaw?.doubleValue }
    var bestTotal: Double? { bestTotalRaw?.doubleValue }

    private enum CodingKeys: String, CodingKey {
        case id, estimateNumber, status, createdDate, expirationDate, approvedAt
        case selectedOption, signatureFile, signedBy, notes, terms
        case createdAt, updatedAt, customerId, jobId, customer, job, options
        case subtotalRaw = "subtotal"
        case taxAmountRaw = "taxAmount"
        case totalAmountRaw = "totalAmount"
        case goodTotalRaw = "goodTotal"
        case betterTotalRaw = "betterTotal"
        case bestTotalRaw = "bestTotal"
    }

    enum EstimateStatus: String, Codable {
        case draft = "DRAFT"
        case sent = "SENT"
        case viewed = "VIEWED"
        case approved = "APPROVED"
        case declined = "DECLINED"
        case expired = "EXPIRED"
        case converted = "CONVERTED"

        var displayName: String {
            switch self {
            case .draft: return "Draft"
            case .sent: return "Sent"
            case .viewed: return "Viewed"
            case .approved: return "Approved"
            case .declined: return "Declined"
            case .expired: return "Expired"
            case .converted: return "Converted"
            }
        }

        var color: String {
            switch self {
            case .draft: return "gray"
            case .sent: return "blue"
            case .viewed: return "purple"
            case .approved: return "green"
            case .declined: return "red"
            case .expired: return "orange"
            case .converted: return "teal"
            }
        }
    }

    var customerDisplayName: String {
        guard let customer = customer else { return "Unknown Customer" }
        if let companyName = customer.companyName, !companyName.isEmpty {
            return companyName
        }
        let firstName = customer.firstName ?? ""
        let lastName = customer.lastName ?? ""
        let name = "\(firstName) \(lastName)".trimmingCharacters(in: .whitespaces)
        return name.isEmpty ? "Unknown Customer" : name
    }
}

// MARK: - Nested Models

struct EstimateCustomer: Codable, Hashable {
    let id: String
    let firstName: String?
    let lastName: String?
    let companyName: String?
    let email: String?
    let phone: String?
}

struct EstimateJob: Codable, Hashable {
    let id: String
    let jobNumber: String?
    let title: String?
}

struct EstimateOption: Identifiable, Codable, Hashable {
    let id: String
    let name: String
    let description: String?
    let sortOrder: Int
    let isRecommended: Bool
    let lineItems: [EstimateLineItem]?

    // Prisma Decimal fields
    private let subtotalRaw: AnyCodableNumber?
    private let taxAmountRaw: AnyCodableNumber?
    private let totalAmountRaw: AnyCodableNumber?

    var subtotal: Double { subtotalRaw?.doubleValue ?? 0 }
    var taxAmount: Double { taxAmountRaw?.doubleValue ?? 0 }
    var totalAmount: Double { totalAmountRaw?.doubleValue ?? 0 }

    private enum CodingKeys: String, CodingKey {
        case id, name, description, sortOrder, isRecommended, lineItems
        case subtotalRaw = "subtotal"
        case taxAmountRaw = "taxAmount"
        case totalAmountRaw = "totalAmount"
    }
}

struct EstimateLineItem: Identifiable, Codable, Hashable {
    let id: String
    let description: String
    let category: String?
    let sortOrder: Int
    let isOptional: Bool

    // Prisma Decimal fields
    private let quantityRaw: AnyCodableNumber?
    private let unitPriceRaw: AnyCodableNumber?
    private let totalPriceRaw: AnyCodableNumber?

    var quantity: Double { quantityRaw?.doubleValue ?? 0 }
    var unitPrice: Double { unitPriceRaw?.doubleValue ?? 0 }
    var totalPrice: Double { totalPriceRaw?.doubleValue ?? 0 }

    private enum CodingKeys: String, CodingKey {
        case id, description, category, sortOrder, isOptional
        case quantityRaw = "quantity"
        case unitPriceRaw = "unitPrice"
        case totalPriceRaw = "totalPrice"
    }
}
