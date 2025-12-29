import SwiftUI

struct InvoicesView: View {
    @StateObject private var viewModel = InvoicesViewModel()
    @State private var searchText = ""
    @State private var selectedStatus: String? = nil

    let statusFilters = ["All", "DRAFT", "SENT", "PAID", "OVERDUE"]

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Search bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.gray)
                    TextField("Search invoices...", text: $searchText)
                        .textFieldStyle(.plain)
                        .onChange(of: searchText) { newValue in
                            viewModel.search = newValue
                            Task { await viewModel.loadInvoices() }
                        }
                    if !searchText.isEmpty {
                        Button(action: {
                            searchText = ""
                            viewModel.search = ""
                            Task { await viewModel.loadInvoices() }
                        }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.gray)
                        }
                    }
                }
                .padding(12)
                .background(Color(.systemGray6))
                .cornerRadius(10)
                .padding(.horizontal)
                .padding(.top)

                // Status filter chips
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(statusFilters, id: \.self) { status in
                            StatusFilterChip(
                                title: status == "All" ? "All" : status.capitalized,
                                isSelected: (status == "All" && selectedStatus == nil) || selectedStatus == status
                            ) {
                                selectedStatus = status == "All" ? nil : status
                                viewModel.statusFilter = selectedStatus
                                Task { await viewModel.loadInvoices() }
                            }
                        }
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 8)
                }

                // Summary cards
                if !viewModel.invoices.isEmpty {
                    InvoiceSummaryCards(invoices: viewModel.invoices)
                        .padding(.horizontal)
                }

                if viewModel.isLoading {
                    Spacer()
                    ProgressView()
                    Spacer()
                } else if viewModel.invoices.isEmpty {
                    Spacer()
                    VStack(spacing: 12) {
                        Image(systemName: "doc.text")
                            .font(.system(size: 50))
                            .foregroundColor(.gray)
                        Text("No invoices found")
                            .foregroundColor(.textSecondary)
                    }
                    Spacer()
                } else {
                    List {
                        ForEach(viewModel.invoices) { invoice in
                            NavigationLink(destination: InvoiceDetailView(invoiceId: invoice.id)) {
                                InvoiceRowView(invoice: invoice)
                            }
                        }
                    }
                    .listStyle(.plain)
                    .refreshable {
                        await viewModel.loadInvoices()
                    }
                }
            }
            .navigationTitle("Invoices")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    NavigationLink(destination: NewInvoiceView(onSave: {
                        Task { await viewModel.loadInvoices() }
                    })) {
                        Image(systemName: "plus")
                    }
                }
            }
            .task {
                await viewModel.loadInvoices()
            }
        }
    }
}

// MARK: - Invoice Summary Cards
struct InvoiceSummaryCards: View {
    let invoices: [Invoice]

    var totalOutstanding: Double {
        invoices.filter { $0.status != .paid && $0.status != .void }
            .reduce(0) { $0 + $1.balanceDue }
    }

    var overdueAmount: Double {
        invoices.filter { $0.isOverdue }
            .reduce(0) { $0 + $1.balanceDue }
    }

    var paidThisMonth: Double {
        let calendar = Calendar.current
        let now = Date()
        let startOfMonth = calendar.date(from: calendar.dateComponents([.year, .month], from: now))!
        return invoices
            .filter { $0.status == .paid && ($0.paidDate ?? Date.distantPast) >= startOfMonth }
            .reduce(0) { $0 + $1.totalAmount }
    }

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                SummaryCard(title: "Outstanding", amount: totalOutstanding, color: .blue)
                SummaryCard(title: "Overdue", amount: overdueAmount, color: .orange)
                SummaryCard(title: "Paid (Month)", amount: paidThisMonth, color: .green)
            }
            .padding(.vertical, 8)
        }
    }
}

struct SummaryCard: View {
    let title: String
    let amount: Double
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundColor(.textSecondary)
            Text(formatCurrency(amount))
                .font(.headline)
                .foregroundColor(color)
        }
        .padding()
        .frame(minWidth: 100)
        .background(color.opacity(0.1))
        .cornerRadius(10)
    }

    func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        formatter.maximumFractionDigits = 0
        return formatter.string(from: NSNumber(value: amount)) ?? "$0"
    }
}

// MARK: - Invoice Row View
struct InvoiceRowView: View {
    let invoice: Invoice

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(invoice.invoiceNumber)
                        .font(.headline)
                        .foregroundColor(.textPrimary)

                    Text(invoice.customerDisplayName)
                        .font(.subheadline)
                        .foregroundColor(.textSecondary)

                    // Job Number if linked to a job
                    if let job = invoice.job, let jobNumber = job.jobNumber {
                        HStack(spacing: 4) {
                            Image(systemName: "wrench.and.screwdriver")
                                .font(.caption2)
                            Text(jobNumber)
                                .font(.caption)
                        }
                        .foregroundColor(.textTertiary)
                    }
                }

                Spacer()

                InvoiceStatusBadge(status: invoice.status, isOverdue: invoice.isOverdue)
            }

            HStack(spacing: 16) {
                // Due date
                if let dueDate = invoice.dueDate {
                    HStack(spacing: 4) {
                        Image(systemName: "calendar")
                        Text("Due: \(formatDate(dueDate))")
                    }
                    .font(.caption)
                    .foregroundColor(invoice.isOverdue ? .orange : .textSecondary)
                }

                Spacer()

                // Total amount and balance due
                VStack(alignment: .trailing, spacing: 2) {
                    Text(formatCurrency(invoice.totalAmount))
                        .font(.headline)
                        .foregroundColor(.primaryOrange)
                    if invoice.balanceDue > 0 && invoice.balanceDue != invoice.totalAmount {
                        Text("Due: \(formatCurrency(invoice.balanceDue))")
                            .font(.caption2)
                            .foregroundColor(.orange)
                    } else if invoice.paidAmount > 0 && invoice.balanceDue == 0 {
                        Text("Paid in Full")
                            .font(.caption2)
                            .foregroundColor(.green)
                    }
                }
            }
        }
        .padding(.vertical, 8)
    }

    func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        return formatter.string(from: date)
    }

    func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: amount)) ?? "$0.00"
    }
}

// MARK: - Invoice Status Badge
struct InvoiceStatusBadge: View {
    let status: Invoice.InvoiceStatus
    let isOverdue: Bool

    var body: some View {
        Text(isOverdue ? "Overdue" : status.displayName)
            .font(.caption2)
            .fontWeight(.medium)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(backgroundColor)
            .foregroundColor(foregroundColor)
            .cornerRadius(4)
    }

    var backgroundColor: Color {
        if isOverdue { return .orange.opacity(0.2) }
        switch status {
        case .draft: return .gray.opacity(0.2)
        case .sent: return .blue.opacity(0.2)
        case .viewed: return .purple.opacity(0.2)
        case .partiallyPaid: return .orange.opacity(0.2)
        case .paid: return .green.opacity(0.2)
        case .overdue: return .orange.opacity(0.2)
        case .void: return .gray.opacity(0.2)
        }
    }

    var foregroundColor: Color {
        if isOverdue { return .orange }
        switch status {
        case .draft: return .gray
        case .sent: return .blue
        case .viewed: return .purple
        case .partiallyPaid: return .orange
        case .paid: return .green
        case .overdue: return .orange
        case .void: return .gray
        }
    }
}

// MARK: - Invoice Detail View
struct InvoiceDetailView: View {
    let invoiceId: String
    @StateObject private var viewModel = InvoiceDetailViewModel()
    @State private var showPaymentSheet = false

    var body: some View {
        ScrollView {
            if viewModel.isLoading {
                ProgressView()
                    .padding(.top, 50)
            } else if let invoice = viewModel.invoice {
                VStack(spacing: 20) {
                    // Header Card
                    VStack(spacing: 12) {
                        HStack {
                            VStack(alignment: .leading) {
                                Text(invoice.invoiceNumber)
                                    .font(.title2)
                                    .fontWeight(.bold)
                                Text(invoice.customerDisplayName)
                                    .foregroundColor(.textSecondary)
                            }
                            Spacer()
                            InvoiceStatusBadge(status: invoice.status, isOverdue: invoice.isOverdue)
                        }

                        Divider()

                        HStack {
                            VStack(alignment: .leading) {
                                Text("Balance Due")
                                    .font(.caption)
                                    .foregroundColor(.textSecondary)
                                Text(formatCurrency(invoice.balanceDue))
                                    .font(.title)
                                    .fontWeight(.bold)
                                    .foregroundColor(invoice.balanceDue > 0 ? .primaryOrange : .green)
                            }
                            Spacer()
                            VStack(alignment: .trailing) {
                                Text("Total")
                                    .font(.caption)
                                    .foregroundColor(.textSecondary)
                                Text(formatCurrency(invoice.totalAmount))
                                    .font(.headline)
                            }
                        }

                        if let dueDate = invoice.dueDate {
                            HStack {
                                Image(systemName: "calendar")
                                    .foregroundColor(invoice.isOverdue ? .orange : .gray)
                                Text("Due: \(formatDate(dueDate))")
                                    .font(.subheadline)
                                    .foregroundColor(invoice.isOverdue ? .orange : .textSecondary)
                                Spacer()
                            }
                        }
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
                    .shadow(color: .black.opacity(0.05), radius: 5)

                    // Line Items Card
                    if let items = invoice.lineItems, !items.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Line Items")
                                .font(.headline)

                            ForEach(items) { item in
                                HStack {
                                    VStack(alignment: .leading) {
                                        Text(item.description)
                                            .font(.subheadline)
                                        Text("\(Int(item.quantity)) x \(formatCurrency(item.unitPrice))")
                                            .font(.caption)
                                            .foregroundColor(.textSecondary)
                                    }
                                    Spacer()
                                    Text(formatCurrency(item.totalPrice))
                                        .font(.subheadline)
                                        .fontWeight(.medium)
                                }
                                Divider()
                            }

                            // Totals
                            HStack {
                                Text("Subtotal")
                                Spacer()
                                Text(formatCurrency(invoice.subtotal))
                            }
                            .font(.subheadline)

                            HStack {
                                Text("Tax (\(Int(invoice.taxRate * 100))%)")
                                Spacer()
                                Text(formatCurrency(invoice.taxAmount))
                            }
                            .font(.subheadline)
                            .foregroundColor(.textSecondary)

                            HStack {
                                Text("Total")
                                    .fontWeight(.bold)
                                Spacer()
                                Text(formatCurrency(invoice.totalAmount))
                                    .fontWeight(.bold)
                            }
                        }
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(12)
                        .shadow(color: .black.opacity(0.05), radius: 5)
                    }

                    // Payments Card
                    if let payments = invoice.payments, !payments.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Payments")
                                .font(.headline)

                            ForEach(payments) { payment in
                                HStack {
                                    VStack(alignment: .leading) {
                                        Text(payment.paymentMethod ?? "Payment")
                                            .font(.subheadline)
                                        if let date = payment.paymentDate {
                                            Text(formatDate(date))
                                                .font(.caption)
                                                .foregroundColor(.textSecondary)
                                        }
                                    }
                                    Spacer()
                                    Text(formatCurrency(payment.amount))
                                        .font(.subheadline)
                                        .fontWeight(.medium)
                                        .foregroundColor(.green)
                                }
                            }
                        }
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(12)
                        .shadow(color: .black.opacity(0.05), radius: 5)
                    }

                    // Action Buttons
                    if invoice.balanceDue > 0 {
                        Button(action: { showPaymentSheet = true }) {
                            HStack {
                                Image(systemName: "creditcard.fill")
                                Text("Record Payment")
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.green)
                            .foregroundColor(.white)
                            .cornerRadius(10)
                        }
                    }
                }
                .padding()
            } else {
                Text("Invoice not found")
                    .foregroundColor(.textSecondary)
                    .padding(.top, 50)
            }
        }
        .background(Color.backgroundPrimary)
        .navigationTitle("Invoice")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await viewModel.loadInvoice(id: invoiceId)
        }
        .sheet(isPresented: $showPaymentSheet) {
            if let invoice = viewModel.invoice {
                RecordPaymentSheet(invoiceId: invoice.id, balanceDue: invoice.balanceDue) {
                    Task { await viewModel.loadInvoice(id: invoiceId) }
                }
            }
        }
    }

    func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: amount)) ?? "$0.00"
    }

    func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }
}

// MARK: - Record Payment Sheet
struct RecordPaymentSheet: View {
    let invoiceId: String
    let balanceDue: Double
    let onComplete: () -> Void

    @Environment(\.dismiss) var dismiss
    @State private var amount = ""
    @State private var paymentMethod = "Cash"
    @State private var reference = ""
    @State private var isSubmitting = false

    let paymentMethods = ["Cash", "Check", "Credit Card", "Bank Transfer", "Other"]

    var body: some View {
        NavigationStack {
            Form {
                Section("Payment Details") {
                    TextField("Amount", text: $amount)
                        .keyboardType(.decimalPad)

                    Picker("Payment Method", selection: $paymentMethod) {
                        ForEach(paymentMethods, id: \.self) { method in
                            Text(method).tag(method)
                        }
                    }

                    TextField("Reference (optional)", text: $reference)
                }

                Section {
                    Text("Balance Due: \(formatCurrency(balanceDue))")
                        .foregroundColor(.textSecondary)
                }

                Section {
                    Button(action: submitPayment) {
                        if isSubmitting {
                            ProgressView()
                        } else {
                            HStack {
                                Spacer()
                                Text("Record Payment")
                                Spacer()
                            }
                        }
                    }
                    .disabled(amount.isEmpty || isSubmitting)
                }
            }
            .navigationTitle("Record Payment")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }

    func submitPayment() {
        guard let amountValue = Double(amount) else { return }
        isSubmitting = true

        Task {
            do {
                _ = try await InvoiceService.shared.recordPayment(
                    invoiceId: invoiceId,
                    amount: amountValue,
                    paymentMethod: paymentMethod,
                    reference: reference.isEmpty ? nil : reference
                )
                onComplete()
                dismiss()
            } catch {
                print("Error recording payment: \(error)")
            }
            isSubmitting = false
        }
    }

    func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: amount)) ?? "$0.00"
    }
}

// MARK: - View Models

@MainActor
class InvoicesViewModel: ObservableObject {
    @Published var invoices: [Invoice] = []
    @Published var isLoading = false
    @Published var error: String?
    @Published var search = ""
    @Published var statusFilter: String?

    func loadInvoices() async {
        isLoading = true
        do {
            let response = try await InvoiceService.shared.getInvoices(
                status: statusFilter,
                search: search.isEmpty ? nil : search
            )
            invoices = response.invoices
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }
}

@MainActor
class InvoiceDetailViewModel: ObservableObject {
    @Published var invoice: Invoice?
    @Published var isLoading = false
    @Published var error: String?

    func loadInvoice(id: String) async {
        isLoading = true
        do {
            invoice = try await InvoiceService.shared.getInvoice(id: id)
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }
}

// MARK: - New Invoice View

struct NewInvoiceView: View {
    @Environment(\.dismiss) var dismiss
    var onSave: (() -> Void)?

    @State private var customers: [Customer] = []
    @State private var selectedCustomerId: String = ""
    @State private var dueDate = Date().addingTimeInterval(30 * 24 * 60 * 60) // 30 days
    @State private var taxRate = "0"
    @State private var notes = ""
    @State private var terms = ""
    @State private var lineItems: [NewInvoiceLineItem] = [NewInvoiceLineItem()]

    @State private var isLoadingCustomers = true
    @State private var isSaving = false
    @State private var errorMessage: String?

    let categories = ["LABOR", "PARTS", "EQUIPMENT", "OTHER"]

    var body: some View {
        Form {
            Section("Customer") {
                if isLoadingCustomers {
                    ProgressView("Loading customers...")
                } else {
                    Picker("Customer *", selection: $selectedCustomerId) {
                        Text("Select Customer").tag("")
                        ForEach(customers) { customer in
                            Text(customer.displayName).tag(customer.id)
                        }
                    }
                }
            }

            Section("Invoice Details") {
                DatePicker("Due Date", selection: $dueDate, displayedComponents: .date)
                HStack {
                    Text("Tax Rate (%)")
                    Spacer()
                    TextField("0", text: $taxRate)
                        .keyboardType(.decimalPad)
                        .multilineTextAlignment(.trailing)
                        .frame(width: 80)
                }
            }

            Section(header: HStack {
                Text("Line Items")
                Spacer()
                Button(action: addLineItem) {
                    Image(systemName: "plus.circle.fill")
                        .foregroundColor(.primaryOrange)
                }
            }) {
                if lineItems.isEmpty {
                    Text("No line items added")
                        .foregroundColor(.textSecondary)
                } else {
                    ForEach($lineItems) { $item in
                        VStack(alignment: .leading, spacing: 8) {
                            TextField("Description", text: $item.description)
                            Picker("Category", selection: $item.category) {
                                ForEach(categories, id: \.self) { cat in
                                    Text(cat.capitalized).tag(cat)
                                }
                            }
                            HStack {
                                TextField("Qty", text: $item.quantity)
                                    .keyboardType(.decimalPad)
                                    .frame(width: 60)
                                TextField("Unit Price", text: $item.unitPrice)
                                    .keyboardType(.decimalPad)
                                Spacer()
                                Text(item.totalFormatted)
                                    .foregroundColor(.primaryOrange)
                            }
                        }
                    }
                    .onDelete(perform: deleteLineItem)
                }
            }

            Section("Notes & Terms") {
                TextField("Notes", text: $notes, axis: .vertical)
                    .lineLimit(3...6)
                TextField("Terms", text: $terms, axis: .vertical)
                    .lineLimit(3...6)
            }

            if let error = errorMessage {
                Section {
                    Text(error)
                        .foregroundColor(.red)
                }
            }
        }
        .navigationTitle("New Invoice")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button("Cancel") { dismiss() }
            }
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Save") {
                    Task { await saveInvoice() }
                }
                .disabled(!isFormValid || isSaving)
            }
        }
        .task {
            await loadCustomers()
        }
    }

    var isFormValid: Bool {
        !selectedCustomerId.isEmpty && !lineItems.isEmpty
    }

    func addLineItem() {
        lineItems.append(NewInvoiceLineItem())
    }

    func deleteLineItem(at offsets: IndexSet) {
        lineItems.remove(atOffsets: offsets)
    }

    func loadCustomers() async {
        isLoadingCustomers = true
        do {
            customers = try await CustomerService.shared.getCustomers()
        } catch {
            errorMessage = "Failed to load customers"
        }
        isLoadingCustomers = false
    }

    func saveInvoice() async {
        isSaving = true
        errorMessage = nil
        do {
            // Convert tax rate from percentage (e.g., 5) to decimal (0.05)
            let taxRateDecimal = (Double(taxRate) ?? 0) / 100.0
            try await InvoiceService.shared.createInvoice(
                customerId: selectedCustomerId,
                dueDate: dueDate,
                taxRate: taxRateDecimal,
                notes: notes.isEmpty ? nil : notes,
                terms: terms.isEmpty ? nil : terms,
                lineItems: lineItems.map { item in
                    InvoiceLineItemInput(
                        description: item.description,
                        category: item.category,
                        quantity: Double(item.quantity) ?? 1,
                        unitPrice: Double(item.unitPrice) ?? 0
                    )
                }
            )
            onSave?()
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
        isSaving = false
    }
}

struct NewInvoiceLineItem: Identifiable {
    let id = UUID()
    var description = ""
    var category = "LABOR"
    var quantity = "1"
    var unitPrice = ""

    var total: Double {
        (Double(quantity) ?? 0) * (Double(unitPrice) ?? 0)
    }

    var totalFormatted: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: total)) ?? "$0.00"
    }
}

struct InvoiceLineItemInput {
    let description: String
    let category: String
    let quantity: Double
    let unitPrice: Double
}

#Preview {
    InvoicesView()
}
