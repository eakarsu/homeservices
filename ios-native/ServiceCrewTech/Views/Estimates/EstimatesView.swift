import SwiftUI

struct EstimatesView: View {
    @StateObject private var viewModel = EstimatesViewModel()
    @State private var searchText = ""
    @State private var selectedStatus: String? = nil

    let statusFilters = ["All", "DRAFT", "SENT", "APPROVED", "DECLINED", "EXPIRED"]

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Search bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.gray)
                    TextField("Search estimates...", text: $searchText)
                        .textFieldStyle(.plain)
                        .onChange(of: searchText) { newValue in
                            viewModel.search = newValue
                            Task { await viewModel.loadEstimates() }
                        }
                    if !searchText.isEmpty {
                        Button(action: {
                            searchText = ""
                            viewModel.search = ""
                            Task { await viewModel.loadEstimates() }
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
                                Task { await viewModel.loadEstimates() }
                            }
                        }
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 8)
                }

                if viewModel.isLoading {
                    Spacer()
                    ProgressView()
                    Spacer()
                } else if viewModel.estimates.isEmpty {
                    Spacer()
                    VStack(spacing: 12) {
                        Image(systemName: "doc.text")
                            .font(.system(size: 50))
                            .foregroundColor(.gray)
                        Text("No estimates found")
                            .foregroundColor(.textSecondary)
                    }
                    Spacer()
                } else {
                    List {
                        ForEach(viewModel.estimates) { estimate in
                            NavigationLink(destination: EstimateDetailView(estimateId: estimate.id)) {
                                EstimateRowView(estimate: estimate)
                            }
                        }
                    }
                    .listStyle(.plain)
                    .refreshable {
                        await viewModel.loadEstimates()
                    }
                }
            }
            .navigationTitle("Estimates")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    NavigationLink(destination: NewEstimateView(onSave: {
                        Task { await viewModel.loadEstimates() }
                    })) {
                        Image(systemName: "plus")
                    }
                }
            }
            .task {
                await viewModel.loadEstimates()
            }
        }
    }
}

// MARK: - Status Filter Chip
struct StatusFilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .fontWeight(isSelected ? .semibold : .regular)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isSelected ? Color.primaryOrange : Color(.systemGray5))
                .foregroundColor(isSelected ? .white : .textPrimary)
                .cornerRadius(16)
        }
    }
}

// MARK: - Estimate Row View
struct EstimateRowView: View {
    let estimate: Estimate

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(estimate.estimateNumber)
                        .font(.headline)
                        .foregroundColor(.textPrimary)

                    Text(estimate.customerDisplayName)
                        .font(.subheadline)
                        .foregroundColor(.textSecondary)

                    // Job Number if linked to a job
                    if let job = estimate.job, let jobNumber = job.jobNumber {
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

                EstimateStatusBadge(status: estimate.status)
            }

            HStack(spacing: 16) {
                // Created date
                if let date = estimate.createdDate ?? estimate.createdAt {
                    HStack(spacing: 4) {
                        Image(systemName: "calendar")
                        Text(formatDate(date))
                    }
                    .font(.caption)
                    .foregroundColor(.textSecondary)
                }

                Spacer()

                // Total amount
                Text(formatCurrency(estimate.totalAmount))
                    .font(.headline)
                    .foregroundColor(.primaryOrange)
            }

            // Good/Better/Best options
            if let goodTotal = estimate.goodTotal, let betterTotal = estimate.betterTotal, let bestTotal = estimate.bestTotal {
                HStack(spacing: 8) {
                    OptionPill(label: "Good", amount: goodTotal, color: .gray)
                    OptionPill(label: "Better", amount: betterTotal, color: .blue)
                    OptionPill(label: "Best", amount: bestTotal, color: .green)
                }
            }
        }
        .padding(.vertical, 8)
    }

    func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }

    func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: amount)) ?? "$0.00"
    }
}

// MARK: - Option Pill
struct OptionPill: View {
    let label: String
    let amount: Double
    let color: Color

    var body: some View {
        VStack(spacing: 2) {
            Text(label)
                .font(.caption2)
                .foregroundColor(color)
            Text(formatCurrency(amount))
                .font(.caption)
                .fontWeight(.medium)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(color.opacity(0.1))
        .cornerRadius(6)
    }

    func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        formatter.maximumFractionDigits = 0
        return formatter.string(from: NSNumber(value: amount)) ?? "$0"
    }
}

// MARK: - Estimate Status Badge
struct EstimateStatusBadge: View {
    let status: Estimate.EstimateStatus

    var body: some View {
        Text(status.displayName)
            .font(.caption2)
            .fontWeight(.medium)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(backgroundColor)
            .foregroundColor(foregroundColor)
            .cornerRadius(4)
    }

    var backgroundColor: Color {
        switch status {
        case .draft: return .gray.opacity(0.2)
        case .sent: return .blue.opacity(0.2)
        case .viewed: return .purple.opacity(0.2)
        case .approved: return .green.opacity(0.2)
        case .declined: return .gray.opacity(0.2)
        case .expired: return .orange.opacity(0.2)
        case .converted: return .teal.opacity(0.2)
        }
    }

    var foregroundColor: Color {
        switch status {
        case .draft: return .gray
        case .sent: return .blue
        case .viewed: return .purple
        case .approved: return .green
        case .declined: return .gray
        case .expired: return .orange
        case .converted: return .teal
        }
    }
}

// MARK: - Estimate Detail View
struct EstimateDetailView: View {
    let estimateId: String
    @StateObject private var viewModel = EstimateDetailViewModel()
    @State private var showSendSheet = false
    @State private var sendEmail = ""

    var body: some View {
        ScrollView {
            if viewModel.isLoading {
                ProgressView()
                    .padding(.top, 50)
            } else if let estimate = viewModel.estimate {
                VStack(spacing: 20) {
                    // Header Card
                    VStack(spacing: 12) {
                        HStack {
                            VStack(alignment: .leading) {
                                Text(estimate.estimateNumber)
                                    .font(.title2)
                                    .fontWeight(.bold)
                                Text(estimate.customerDisplayName)
                                    .foregroundColor(.textSecondary)
                            }
                            Spacer()
                            EstimateStatusBadge(status: estimate.status)
                        }

                        Divider()

                        HStack {
                            VStack(alignment: .leading) {
                                Text("Total")
                                    .font(.caption)
                                    .foregroundColor(.textSecondary)
                                Text(formatCurrency(estimate.totalAmount))
                                    .font(.title)
                                    .fontWeight(.bold)
                                    .foregroundColor(.primaryOrange)
                            }
                            Spacer()
                            if let expDate = estimate.expirationDate {
                                VStack(alignment: .trailing) {
                                    Text("Expires")
                                        .font(.caption)
                                        .foregroundColor(.textSecondary)
                                    Text(formatDate(expDate))
                                        .font(.subheadline)
                                }
                            }
                        }
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
                    .shadow(color: .black.opacity(0.05), radius: 5)

                    // Options Card
                    if let options = estimate.options, !options.isEmpty {
                        VStack(alignment: .leading, spacing: 16) {
                            Text("Options")
                                .font(.headline)

                            ForEach(options) { option in
                                EstimateOptionCard(option: option, isSelected: estimate.selectedOption == option.name.lowercased())
                            }
                        }
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(12)
                        .shadow(color: .black.opacity(0.05), radius: 5)
                    }

                    // Customer Info Card
                    if let customer = estimate.customer {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Customer")
                                .font(.headline)

                            if let phone = customer.phone {
                                Button(action: {
                                    if let url = URL(string: "tel:\(phone)") {
                                        UIApplication.shared.open(url)
                                    }
                                }) {
                                    HStack {
                                        Image(systemName: "phone.fill")
                                            .foregroundColor(.primaryOrange)
                                        Text(phone)
                                        Spacer()
                                        Image(systemName: "chevron.right")
                                            .foregroundColor(.gray)
                                    }
                                }
                            }

                            if let email = customer.email {
                                Button(action: {
                                    if let url = URL(string: "mailto:\(email)") {
                                        UIApplication.shared.open(url)
                                    }
                                }) {
                                    HStack {
                                        Image(systemName: "envelope.fill")
                                            .foregroundColor(.primaryOrange)
                                        Text(email)
                                        Spacer()
                                        Image(systemName: "chevron.right")
                                            .foregroundColor(.gray)
                                    }
                                }
                            }
                        }
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(12)
                        .shadow(color: .black.opacity(0.05), radius: 5)
                    }

                    // Notes Card
                    if let notes = estimate.notes, !notes.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Notes")
                                .font(.headline)
                            Text(notes)
                                .foregroundColor(.textSecondary)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(12)
                        .shadow(color: .black.opacity(0.05), radius: 5)
                    }

                    // Action Buttons
                    if estimate.status == .draft {
                        Button(action: { showSendSheet = true }) {
                            HStack {
                                Image(systemName: "paperplane.fill")
                                Text("Send to Customer")
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.primaryOrange)
                            .foregroundColor(.white)
                            .cornerRadius(10)
                        }
                    }
                }
                .padding()
            } else {
                Text("Estimate not found")
                    .foregroundColor(.textSecondary)
                    .padding(.top, 50)
            }
        }
        .background(Color.backgroundPrimary)
        .navigationTitle("Estimate")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await viewModel.loadEstimate(id: estimateId)
        }
        .sheet(isPresented: $showSendSheet) {
            SendEstimateSheet(email: $sendEmail) {
                Task {
                    await viewModel.sendEstimate(id: estimateId, email: sendEmail)
                    showSendSheet = false
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

// MARK: - Estimate Option Card
struct EstimateOptionCard: View {
    let option: EstimateOption
    let isSelected: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading) {
                    HStack {
                        Text(option.name)
                            .font(.headline)
                        if option.isRecommended {
                            Text("Recommended")
                                .font(.caption2)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Color.primaryOrange.opacity(0.2))
                                .foregroundColor(.primaryOrange)
                                .cornerRadius(4)
                        }
                    }
                    if let desc = option.description {
                        Text(desc)
                            .font(.caption)
                            .foregroundColor(.textSecondary)
                    }
                }
                Spacer()
                Text(formatCurrency(option.totalAmount))
                    .font(.title3)
                    .fontWeight(.semibold)
                    .foregroundColor(.primaryOrange)
            }

            if let items = option.lineItems, !items.isEmpty {
                Divider()
                ForEach(items.prefix(3)) { item in
                    HStack {
                        Text(item.description)
                            .font(.caption)
                            .foregroundColor(.textSecondary)
                        Spacer()
                        Text(formatCurrency(item.totalPrice))
                            .font(.caption)
                    }
                }
                if items.count > 3 {
                    Text("+ \(items.count - 3) more items")
                        .font(.caption)
                        .foregroundColor(.primaryOrange)
                }
            }
        }
        .padding()
        .background(isSelected ? Color.primaryOrange.opacity(0.1) : Color(.systemGray6))
        .cornerRadius(8)
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(isSelected ? Color.primaryOrange : Color.clear, lineWidth: 2)
        )
    }

    func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: amount)) ?? "$0.00"
    }
}

// MARK: - Send Estimate Sheet
struct SendEstimateSheet: View {
    @Binding var email: String
    let onSend: () -> Void
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("Recipient") {
                    TextField("Email address", text: $email)
                        .keyboardType(.emailAddress)
                        .textContentType(.emailAddress)
                        .autocapitalization(.none)
                }

                Section {
                    Button(action: onSend) {
                        HStack {
                            Spacer()
                            Text("Send Estimate")
                            Spacer()
                        }
                    }
                    .disabled(email.isEmpty)
                }
            }
            .navigationTitle("Send Estimate")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}

// MARK: - View Models

@MainActor
class EstimatesViewModel: ObservableObject {
    @Published var estimates: [Estimate] = []
    @Published var isLoading = false
    @Published var error: String?
    @Published var search = ""
    @Published var statusFilter: String?

    func loadEstimates() async {
        isLoading = true
        do {
            let response = try await EstimateService.shared.getEstimates(
                status: statusFilter,
                search: search.isEmpty ? nil : search
            )
            estimates = response.estimates
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }
}

@MainActor
class EstimateDetailViewModel: ObservableObject {
    @Published var estimate: Estimate?
    @Published var isLoading = false
    @Published var error: String?

    func loadEstimate(id: String) async {
        isLoading = true
        do {
            estimate = try await EstimateService.shared.getEstimate(id: id)
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }

    func sendEstimate(id: String, email: String) async {
        do {
            try await EstimateService.shared.sendEstimate(id: id, email: email)
            await loadEstimate(id: id)
        } catch {
            self.error = error.localizedDescription
        }
    }
}

// MARK: - New Estimate View

struct NewEstimateView: View {
    @Environment(\.dismiss) var dismiss
    var onSave: (() -> Void)?

    @State private var customers: [Customer] = []
    @State private var selectedCustomerId: String = ""
    @State private var title = ""
    @State private var taxRate = "0"
    @State private var notes = ""
    @State private var terms = ""

    // Line items for Good option (simplified - web has Good/Better/Best)
    @State private var lineItems: [NewLineItem] = [NewLineItem()]

    @State private var isLoadingCustomers = true
    @State private var isSaving = false
    @State private var errorMessage: String?

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

            Section("Estimate Details") {
                TextField("Title", text: $title)
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
                TextField("Terms & Conditions", text: $terms, axis: .vertical)
                    .lineLimit(3...6)
            }

            if let error = errorMessage {
                Section {
                    Text(error)
                        .foregroundColor(.red)
                }
            }
        }
        .navigationTitle("New Estimate")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button("Cancel") { dismiss() }
            }
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Save") {
                    Task { await saveEstimate() }
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
        lineItems.append(NewLineItem())
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

    func saveEstimate() async {
        isSaving = true
        errorMessage = nil
        do {
            // Convert tax rate from percentage (e.g., 5) to decimal (0.05)
            let taxRateDecimal = (Double(taxRate) ?? 0) / 100.0
            try await EstimateService.shared.createEstimate(
                customerId: selectedCustomerId,
                title: title.isEmpty ? nil : title,
                taxRate: taxRateDecimal,
                notes: notes.isEmpty ? nil : notes,
                terms: terms.isEmpty ? nil : terms,
                lineItems: lineItems.map { item in
                    EstimateLineItemInput(
                        description: item.description,
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

struct NewLineItem: Identifiable {
    let id = UUID()
    var description = ""
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

struct EstimateLineItemInput {
    let description: String
    let quantity: Double
    let unitPrice: Double
}

#Preview {
    EstimatesView()
}
