import Foundation

// MARK: - Invoice Model

struct Invoice: Identifiable, Codable, Hashable {
    let id: String
    let invoiceNumber: String
    let status: InvoiceStatus
    let issueDate: Date?
    let dueDate: Date?
    let paidDate: Date?
    let notes: String?
    let terms: String?
    let createdAt: Date?
    let updatedAt: Date?
    let customerId: String
    let jobId: String?
    let customer: InvoiceCustomer?
    let job: InvoiceJob?
    let lineItems: [InvoiceLineItem]?
    let payments: [Payment]?

    // Prisma Decimal fields come as strings
    private let subtotalRaw: AnyCodableNumber?
    private let taxRateRaw: AnyCodableNumber?
    private let taxAmountRaw: AnyCodableNumber?
    private let totalAmountRaw: AnyCodableNumber?
    private let paidAmountRaw: AnyCodableNumber?
    private let balanceDueRaw: AnyCodableNumber?

    var subtotal: Double { subtotalRaw?.doubleValue ?? 0 }
    var taxRate: Double { taxRateRaw?.doubleValue ?? 0 }
    var taxAmount: Double { taxAmountRaw?.doubleValue ?? 0 }
    var totalAmount: Double { totalAmountRaw?.doubleValue ?? 0 }
    var paidAmount: Double { paidAmountRaw?.doubleValue ?? 0 }
    var balanceDue: Double { balanceDueRaw?.doubleValue ?? 0 }

    private enum CodingKeys: String, CodingKey {
        case id, invoiceNumber, status, issueDate, dueDate, paidDate
        case notes, terms, createdAt, updatedAt, customerId, jobId
        case customer, job, lineItems, payments
        case subtotalRaw = "subtotal"
        case taxRateRaw = "taxRate"
        case taxAmountRaw = "taxAmount"
        case totalAmountRaw = "totalAmount"
        case paidAmountRaw = "paidAmount"
        case balanceDueRaw = "balanceDue"
    }

    enum InvoiceStatus: String, Codable {
        case draft = "DRAFT"
        case sent = "SENT"
        case viewed = "VIEWED"
        case partiallyPaid = "PARTIALLY_PAID"
        case paid = "PAID"
        case overdue = "OVERDUE"
        case void = "VOID"

        var displayName: String {
            switch self {
            case .draft: return "Draft"
            case .sent: return "Sent"
            case .viewed: return "Viewed"
            case .partiallyPaid: return "Partial"
            case .paid: return "Paid"
            case .overdue: return "Overdue"
            case .void: return "Void"
            }
        }

        var color: String {
            switch self {
            case .draft: return "gray"
            case .sent: return "blue"
            case .viewed: return "purple"
            case .partiallyPaid: return "orange"
            case .paid: return "green"
            case .overdue: return "red"
            case .void: return "gray"
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

    var isOverdue: Bool {
        guard let dueDate = dueDate, status != .paid && status != .void else { return false }
        return dueDate < Date()
    }
}

// MARK: - Nested Models

struct InvoiceCustomer: Codable, Hashable {
    let id: String
    let firstName: String?
    let lastName: String?
    let companyName: String?
    let email: String?
    let phone: String?
}

struct InvoiceJob: Codable, Hashable {
    let id: String
    let jobNumber: String?
    let title: String?
}

struct InvoiceLineItem: Identifiable, Codable, Hashable {
    let id: String
    let description: String
    let category: String?
    let sortOrder: Int?

    // Prisma Decimal fields
    private let quantityRaw: AnyCodableNumber?
    private let unitPriceRaw: AnyCodableNumber?
    private let totalPriceRaw: AnyCodableNumber?

    var quantity: Double { quantityRaw?.doubleValue ?? 0 }
    var unitPrice: Double { unitPriceRaw?.doubleValue ?? 0 }
    var totalPrice: Double { totalPriceRaw?.doubleValue ?? 0 }

    private enum CodingKeys: String, CodingKey {
        case id, description, category, sortOrder
        case quantityRaw = "quantity"
        case unitPriceRaw = "unitPrice"
        case totalPriceRaw = "totalPrice"
    }
}

struct Payment: Identifiable, Codable, Hashable {
    let id: String
    let paymentMethod: String?
    let paymentDate: Date?
    let reference: String?
    let notes: String?

    // Prisma Decimal field
    private let amountRaw: AnyCodableNumber?

    var amount: Double { amountRaw?.doubleValue ?? 0 }

    private enum CodingKeys: String, CodingKey {
        case id, paymentMethod, paymentDate, reference, notes
        case amountRaw = "amount"
    }
}
