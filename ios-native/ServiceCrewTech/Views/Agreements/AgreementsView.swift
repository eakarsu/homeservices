import SwiftUI

// MARK: - Agreements View

struct AgreementsView: View {
    @State private var agreements: [ServiceAgreement] = []
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var searchText = ""
    @State private var selectedStatus: ServiceAgreement.AgreementStatus?
    @State private var selectedAgreement: ServiceAgreement?

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    ProgressView("Loading agreements...")
                } else if let error = errorMessage {
                    VStack(spacing: 16) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.largeTitle)
                            .foregroundColor(.orange)
                        Text(error)
                            .multilineTextAlignment(.center)
                        Button("Retry") {
                            Task { await loadAgreements() }
                        }
                        .buttonStyle(.bordered)
                    }
                    .padding()
                } else if filteredAgreements.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "doc.text")
                            .font(.system(size: 50))
                            .foregroundColor(.secondary)
                        Text("No Agreements")
                            .font(.title2)
                            .fontWeight(.semibold)
                        Text("No service agreements found")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .padding()
                } else {
                    List(filteredAgreements) { agreement in
                        AgreementRow(agreement: agreement)
                            .contentShape(Rectangle())
                            .onTapGesture {
                                selectedAgreement = agreement
                            }
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Agreements")
            .searchable(text: $searchText, prompt: "Search agreements...")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    NavigationLink(destination: NewAgreementView(onSave: {
                        Task { await loadAgreements() }
                    })) {
                        Image(systemName: "plus")
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Menu {
                        Button("All") { selectedStatus = nil }
                        ForEach(ServiceAgreement.AgreementStatus.allCases, id: \.self) { status in
                            Button(status.rawValue.capitalized) {
                                selectedStatus = status
                            }
                        }
                    } label: {
                        Label(selectedStatus?.rawValue.capitalized ?? "Filter", systemImage: "line.3.horizontal.decrease.circle")
                    }
                }
            }
            .refreshable {
                await loadAgreements()
            }
            .sheet(item: $selectedAgreement) { agreement in
                AgreementDetailView(agreement: agreement)
            }
        }
        .task {
            await loadAgreements()
        }
    }

    private var filteredAgreements: [ServiceAgreement] {
        var result = agreements

        if let status = selectedStatus {
            result = result.filter { $0.status == status }
        }

        if !searchText.isEmpty {
            result = result.filter { agreement in
                agreement.agreementNumber.localizedCaseInsensitiveContains(searchText) ||
                agreement.customer?.name.localizedCaseInsensitiveContains(searchText) == true
            }
        }

        return result
    }

    private func loadAgreements() async {
        isLoading = true
        errorMessage = nil

        do {
            agreements = try await AgreementService.shared.getAgreements()
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }
}

// MARK: - Agreement Status Extension

extension ServiceAgreement.AgreementStatus: CaseIterable {
    static var allCases: [ServiceAgreement.AgreementStatus] {
        [.active, .pending, .expired, .cancelled]
    }
}

// MARK: - Agreement Row

struct AgreementRow: View {
    let agreement: ServiceAgreement

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(agreement.agreementNumber)
                    .font(.headline)
                Spacer()
                AgreementStatusBadge(status: agreement.status)
            }

            if let customer = agreement.customer {
                Text(customer.name)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }

            if let plan = agreement.plan {
                HStack {
                    // Plan name
                    HStack(spacing: 4) {
                        Image(systemName: "doc.text")
                            .font(.caption)
                        Text(plan.name)
                            .font(.caption)
                    }
                    .foregroundColor(.secondary)

                    Spacer()

                    // Visits included
                    if let visits = plan.visitsIncluded {
                        HStack(spacing: 4) {
                            Image(systemName: "calendar.badge.checkmark")
                                .font(.caption2)
                            Text("\(visits) visits/yr")
                                .font(.caption)
                        }
                        .foregroundColor(.blue)
                    }
                }

                // Price with frequency
                HStack {
                    Text(formatPrice(plan.price))
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.primaryOrange)
                    Text("/\(plan.billingFrequency)")
                        .font(.caption)
                        .foregroundColor(.textSecondary)
                }
            }

            HStack {
                if let startDate = agreement.startDate {
                    Label(startDate.formatted(date: .abbreviated, time: .omitted), systemImage: "calendar")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                if let endDate = agreement.endDate {
                    Text("→")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(endDate.formatted(date: .abbreviated, time: .omitted))
                        .font(.caption)
                        .foregroundColor(agreement.isExpiringSoon ? .orange : .secondary)
                }

                if agreement.isExpiringSoon {
                    Text("Expiring Soon")
                        .font(.caption2)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.orange.opacity(0.2))
                        .foregroundColor(.orange)
                        .cornerRadius(4)
                }
            }
        }
        .padding(.vertical, 4)
    }

    private func formatPrice(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: amount)) ?? "$\(amount)"
    }
}

// MARK: - Agreement Status Badge

struct AgreementStatusBadge: View {
    let status: ServiceAgreement.AgreementStatus

    var body: some View {
        Text(status.rawValue.capitalized)
            .font(.caption)
            .fontWeight(.medium)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(statusColor.opacity(0.2))
            .foregroundColor(statusColor)
            .cornerRadius(6)
    }

    private var statusColor: Color {
        switch status {
        case .active: return .green
        case .pending: return .orange
        case .expired: return .gray
        case .cancelled: return .red
        }
    }
}

// MARK: - Agreement Detail View

struct AgreementDetailView: View {
    let agreement: ServiceAgreement

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Header
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text(agreement.agreementNumber)
                                .font(.title2)
                                .fontWeight(.bold)
                            Spacer()
                            AgreementStatusBadge(status: agreement.status)
                        }

                        if let customer = agreement.customer {
                            Text(customer.name)
                                .font(.headline)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)

                    // Plan Details
                    if let plan = agreement.plan {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Service Plan")
                                .font(.headline)

                            VStack(alignment: .leading, spacing: 8) {
                                HStack {
                                    Text("Plan Name")
                                        .foregroundColor(.secondary)
                                    Spacer()
                                    Text(plan.name)
                                }

                                Divider()

                                HStack {
                                    Text("Price")
                                        .foregroundColor(.secondary)
                                    Spacer()
                                    Text(plan.price, format: .currency(code: "USD"))
                                }

                                Divider()

                                HStack {
                                    Text("Billing Frequency")
                                        .foregroundColor(.secondary)
                                    Spacer()
                                    Text(plan.billingFrequency.capitalized)
                                }

                                if let description = plan.description {
                                    Divider()
                                    Text(description)
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                            .padding()
                            .background(Color(.systemGray6))
                            .cornerRadius(12)
                        }
                    }

                    // Agreement Period
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Agreement Period")
                            .font(.headline)

                        VStack(alignment: .leading, spacing: 8) {
                            if let startDate = agreement.startDate {
                                HStack {
                                    Text("Start Date")
                                        .foregroundColor(.secondary)
                                    Spacer()
                                    Text(startDate.formatted(date: .long, time: .omitted))
                                }
                            }

                            if let endDate = agreement.endDate {
                                Divider()
                                HStack {
                                    Text("End Date")
                                        .foregroundColor(.secondary)
                                    Spacer()
                                    Text(endDate.formatted(date: .long, time: .omitted))
                                }
                            }
                        }
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(12)
                    }
                }
                .padding()
            }
            .navigationTitle("Agreement Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}

// MARK: - New Agreement View

struct NewAgreementView: View {
    @Environment(\.dismiss) var dismiss
    var onSave: (() -> Void)?

    @State private var customers: [Customer] = []
    @State private var plans: [AgreementPlan] = []
    @State private var selectedCustomerId = ""
    @State private var selectedPlanId = ""
    @State private var billingFrequency = "MONTHLY"
    @State private var startDate = Date()
    @State private var autoRenew = true
    @State private var notes = ""

    @State private var isLoading = true
    @State private var isSaving = false
    @State private var errorMessage: String?

    let billingOptions = ["MONTHLY", "ANNUAL"]

    var body: some View {
        Form {
            Section("Customer") {
                if isLoading {
                    ProgressView("Loading...")
                } else {
                    Picker("Customer *", selection: $selectedCustomerId) {
                        Text("Select Customer").tag("")
                        ForEach(customers) { customer in
                            Text(customer.displayName).tag(customer.id)
                        }
                    }
                }
            }

            Section("Plan") {
                if plans.isEmpty {
                    Text("No plans available")
                        .foregroundColor(.textSecondary)
                } else {
                    ForEach(plans, id: \.id) { plan in
                        PlanSelectionRow(
                            plan: plan,
                            isSelected: selectedPlanId == plan.id,
                            billingFrequency: billingFrequency
                        ) {
                            selectedPlanId = plan.id
                        }
                    }
                }
            }

            Section("Billing") {
                Picker("Billing Frequency", selection: $billingFrequency) {
                    ForEach(billingOptions, id: \.self) { option in
                        Text(option.capitalized).tag(option)
                    }
                }
                .pickerStyle(.segmented)

                DatePicker("Start Date", selection: $startDate, displayedComponents: .date)

                Toggle("Auto-Renew", isOn: $autoRenew)
            }

            Section("Notes") {
                TextField("Notes", text: $notes, axis: .vertical)
                    .lineLimit(3...6)
            }

            if let error = errorMessage {
                Section {
                    Text(error)
                        .foregroundColor(.red)
                }
            }
        }
        .navigationTitle("New Agreement")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button("Cancel") { dismiss() }
            }
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Save") {
                    Task { await saveAgreement() }
                }
                .disabled(!isFormValid || isSaving)
            }
        }
        .task {
            await loadData()
        }
    }

    var isFormValid: Bool {
        !selectedCustomerId.isEmpty && !selectedPlanId.isEmpty
    }

    func loadData() async {
        isLoading = true
        do {
            async let customersTask = CustomerService.shared.getCustomers()
            async let plansTask = AgreementService.shared.getPlans()
            customers = try await customersTask
            plans = try await plansTask
        } catch {
            errorMessage = "Failed to load data"
        }
        isLoading = false
    }

    func saveAgreement() async {
        isSaving = true
        errorMessage = nil
        do {
            try await AgreementService.shared.createAgreement(
                customerId: selectedCustomerId,
                planId: selectedPlanId,
                billingFrequency: billingFrequency,
                startDate: startDate,
                autoRenew: autoRenew,
                notes: notes.isEmpty ? nil : notes
            )
            onSave?()
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
        isSaving = false
    }
}

struct PlanSelectionRow: View {
    let plan: AgreementPlan
    let isSelected: Bool
    let billingFrequency: String
    let onSelect: () -> Void

    var body: some View {
        Button(action: onSelect) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(plan.name)
                        .font(.headline)
                        .foregroundColor(.textPrimary)
                    if let desc = plan.description {
                        Text(desc)
                            .font(.caption)
                            .foregroundColor(.textSecondary)
                    }
                    Text("\(plan.visitsIncluded) visits/year")
                        .font(.caption)
                        .foregroundColor(.textTertiary)
                }
                Spacer()
                VStack(alignment: .trailing) {
                    Text(formatPrice(billingFrequency == "MONTHLY" ? plan.monthlyPrice : plan.annualPrice))
                        .font(.headline)
                        .foregroundColor(.primaryOrange)
                    Text(billingFrequency == "MONTHLY" ? "/month" : "/year")
                        .font(.caption)
                        .foregroundColor(.textSecondary)
                }
                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.primaryOrange)
                }
            }
            .padding()
            .background(isSelected ? Color.primaryOrange.opacity(0.1) : Color.backgroundSecondary)
            .cornerRadius(8)
        }
    }

    func formatPrice(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: amount)) ?? "$\(amount)"
    }
}

struct AgreementPlan: Identifiable, Decodable {
    let id: String
    let name: String
    let description: String?
    let tradeType: String?
    let visitsIncluded: Int
    let priorityService: Bool?
    let noDiagnosticFee: Bool?
    let includedServices: [String]?

    // Prisma Decimal fields come as strings
    private let monthlyPriceRaw: AnyCodableNumber?
    private let annualPriceRaw: AnyCodableNumber?
    private let discountPctRaw: AnyCodableNumber?

    var monthlyPrice: Double { monthlyPriceRaw?.doubleValue ?? 0 }
    var annualPrice: Double { annualPriceRaw?.doubleValue ?? 0 }
    var discountPct: Double { discountPctRaw?.doubleValue ?? 0 }

    private enum CodingKeys: String, CodingKey {
        case id, name, description, tradeType, visitsIncluded
        case priorityService, noDiagnosticFee, includedServices
        case monthlyPriceRaw = "monthlyPrice"
        case annualPriceRaw = "annualPrice"
        case discountPctRaw = "discountPct"
    }
}

#Preview {
    AgreementsView()
}
