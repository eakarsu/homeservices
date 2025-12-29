import SwiftUI

struct CustomersView: View {
    @StateObject private var viewModel = CustomersViewModel()
    @State private var searchText = ""

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Search bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.gray)
                    TextField("Search customers...", text: $searchText)
                        .textFieldStyle(.plain)
                        .onChange(of: searchText) { newValue in
                            viewModel.search = newValue
                            Task { await viewModel.loadCustomers() }
                        }
                    if !searchText.isEmpty {
                        Button(action: {
                            searchText = ""
                            viewModel.search = ""
                            Task { await viewModel.loadCustomers() }
                        }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.gray)
                        }
                    }
                }
                .padding(12)
                .background(Color(.systemGray6))
                .cornerRadius(10)
                .padding()

                if viewModel.isLoading {
                    Spacer()
                    ProgressView()
                    Spacer()
                } else if viewModel.customers.isEmpty {
                    Spacer()
                    VStack(spacing: 12) {
                        Image(systemName: "person.3")
                            .font(.system(size: 50))
                            .foregroundColor(.gray)
                        Text("No customers found")
                            .foregroundColor(.textSecondary)
                    }
                    Spacer()
                } else {
                    List {
                        ForEach(viewModel.customers) { customer in
                            NavigationLink(destination: CustomerDetailView(customerId: customer.id)) {
                                CustomerRowView(customer: customer)
                            }
                        }
                    }
                    .listStyle(.plain)
                    .refreshable {
                        await viewModel.loadCustomers()
                    }
                }
            }
            .navigationTitle("Customers")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    NavigationLink(destination: NewCustomerView(onSave: {
                        Task { await viewModel.loadCustomers() }
                    })) {
                        Image(systemName: "plus")
                    }
                }
            }
            .task {
                await viewModel.loadCustomers()
            }
        }
    }
}

// MARK: - Customer Row View
struct CustomerRowView: View {
    let customer: Customer

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(customer.displayName)
                        .font(.headline)
                        .foregroundColor(.textPrimary)

                    if let number = customer.customerNumber {
                        Text(number)
                            .font(.caption)
                            .foregroundColor(.textTertiary)
                    }
                }

                Spacer()

                HStack(spacing: 6) {
                    if let type = customer.type ?? customer.customerType?.rawValue {
                        Text(type.replacingOccurrences(of: "_", with: " ").capitalized)
                            .font(.caption2)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.gray.opacity(0.2))
                            .foregroundColor(.gray)
                            .cornerRadius(4)
                    }
                    StatusBadge(status: customer.status ?? "ACTIVE")
                }
            }

            // Contact info
            HStack(spacing: 12) {
                if let phone = customer.phone {
                    Button(action: {
                        if let url = URL(string: "tel:\(phone)") {
                            UIApplication.shared.open(url)
                        }
                    }) {
                        HStack(spacing: 4) {
                            Image(systemName: "phone.fill")
                            Text(phone)
                        }
                        .font(.caption)
                        .foregroundColor(.green)
                    }
                }

                if let email = customer.email {
                    HStack(spacing: 4) {
                        Image(systemName: "envelope")
                        Text(email)
                            .lineLimit(1)
                    }
                    .font(.caption)
                    .foregroundColor(.textSecondary)
                }
            }

            // Stats row
            HStack(spacing: 16) {
                Label("\(customer.propertyCount ?? 0)", systemImage: "house")
                Label("\(customer.jobCount ?? 0)", systemImage: "wrench.and.screwdriver")
                Label(formatCurrency(customer.totalSpent ?? 0), systemImage: "dollarsign.circle")
                Spacer()
            }
        }
        .padding(.vertical, 8)
    }

    func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: amount)) ?? "$0.00"
    }
}

// MARK: - Status Badge
struct StatusBadge: View {
    let status: String

    var body: some View {
        Text(status.capitalized)
            .font(.caption2)
            .fontWeight(.medium)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(backgroundColor)
            .foregroundColor(foregroundColor)
            .cornerRadius(4)
    }

    var backgroundColor: Color {
        switch status.uppercased() {
        case "ACTIVE": return .green.opacity(0.2)
        case "INACTIVE": return .gray.opacity(0.2)
        case "LEAD": return .blue.opacity(0.2)
        default: return .gray.opacity(0.2)
        }
    }

    var foregroundColor: Color {
        switch status.uppercased() {
        case "ACTIVE": return .green
        case "INACTIVE": return .gray
        case "LEAD": return .blue
        default: return .gray
        }
    }
}

// MARK: - Customer Detail View
struct CustomerDetailView: View {
    let customerId: String
    @StateObject private var viewModel = CustomerDetailViewModel()

    var body: some View {
        ScrollView {
            if viewModel.isLoading {
                ProgressView()
                    .padding(.top, 50)
            } else if let customer = viewModel.customer {
                VStack(spacing: 20) {
                    // Header Card
                    VStack(spacing: 12) {
                        Circle()
                            .fill(Color.primaryOrange.opacity(0.2))
                            .frame(width: 80, height: 80)
                            .overlay(
                                Text(customer.displayName.prefix(2).uppercased())
                                    .font(.title)
                                    .fontWeight(.bold)
                                    .foregroundColor(.primaryOrange)
                            )

                        Text(customer.displayName)
                            .font(.title2)
                            .fontWeight(.bold)

                        if let company = customer.companyName {
                            Text(company)
                                .foregroundColor(.textSecondary)
                        }

                        if let createdAt = customer.createdAt {
                            Text("Customer since \(createdAt.formatted(date: .abbreviated, time: .omitted))")
                                .font(.caption)
                                .foregroundColor(.textTertiary)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
                    .shadow(color: .black.opacity(0.05), radius: 5)

                    // Contact Info Card
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Contact Information")
                            .font(.headline)

                        if let phone = customer.phone {
                            ContactRow(icon: "phone.fill", title: "Phone", value: phone, action: {
                                if let url = URL(string: "tel:\(phone)") {
                                    UIApplication.shared.open(url)
                                }
                            })
                        }

                        if let email = customer.email {
                            ContactRow(icon: "envelope.fill", title: "Email", value: email, action: {
                                if let url = URL(string: "mailto:\(email)") {
                                    UIApplication.shared.open(url)
                                }
                            })
                        }

                        if let source = customer.source {
                            HStack {
                                Image(systemName: "link")
                                    .foregroundColor(.primaryOrange)
                                    .frame(width: 30)
                                VStack(alignment: .leading) {
                                    Text("Source")
                                        .font(.caption)
                                        .foregroundColor(.textSecondary)
                                    Text(source.replacingOccurrences(of: "_", with: " ").capitalized)
                                        .foregroundColor(.textPrimary)
                                }
                                Spacer()
                            }
                        }
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
                    .shadow(color: .black.opacity(0.05), radius: 5)

                    // Properties Card
                    if !viewModel.properties.isEmpty {
                        VStack(alignment: .leading, spacing: 16) {
                            Text("Properties")
                                .font(.headline)

                            ForEach(viewModel.properties) { property in
                                HStack {
                                    Image(systemName: "house.fill")
                                        .foregroundColor(.primaryOrange)
                                        .frame(width: 30)
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(property.address)
                                            .font(.subheadline)
                                        Text("\(property.city), \(property.state) \(property.zip)")
                                            .font(.caption)
                                            .foregroundColor(.textSecondary)
                                    }
                                    Spacer()
                                    if let type = property.propertyType {
                                        Text(type.rawValue.replacingOccurrences(of: "_", with: " ").capitalized)
                                            .font(.caption)
                                            .padding(.horizontal, 8)
                                            .padding(.vertical, 4)
                                            .background(Color.secondaryBlue.opacity(0.2))
                                            .foregroundColor(.secondaryBlue)
                                            .cornerRadius(4)
                                    }
                                }
                                .padding(.vertical, 4)
                            }
                        }
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(12)
                        .shadow(color: .black.opacity(0.05), radius: 5)
                    }

                    // Stats Card
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Statistics")
                            .font(.headline)

                        HStack(spacing: 12) {
                            StatBox(title: "Total Jobs", value: "\(viewModel.stats?.totalJobs ?? 0)", icon: "wrench.and.screwdriver")
                            StatBox(title: "Completed", value: "\(viewModel.stats?.completedJobs ?? 0)", icon: "checkmark.circle")
                            StatBox(title: "Spent", value: formatCurrency(viewModel.stats?.totalSpent ?? 0), icon: "dollarsign.circle")
                        }

                        if let lastService = viewModel.stats?.lastServiceDate {
                            HStack {
                                Image(systemName: "calendar")
                                    .foregroundColor(.textSecondary)
                                Text("Last service: \(lastService.formatted(date: .abbreviated, time: .omitted))")
                                    .font(.caption)
                                    .foregroundColor(.textSecondary)
                            }
                        }
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
                    .shadow(color: .black.opacity(0.05), radius: 5)

                    // Recent Jobs Card
                    if !viewModel.recentJobs.isEmpty {
                        VStack(alignment: .leading, spacing: 16) {
                            Text("Recent Jobs")
                                .font(.headline)

                            ForEach(viewModel.recentJobs.prefix(5)) { job in
                                NavigationLink(destination: JobDetailView(jobId: job.id)) {
                                    HStack {
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text(job.jobNumber)
                                                .font(.subheadline)
                                                .fontWeight(.medium)
                                                .foregroundColor(.textPrimary)
                                            Text(job.title ?? "No title")
                                                .font(.caption)
                                                .foregroundColor(.textSecondary)
                                        }
                                        Spacer()
                                        Text(job.status.displayName)
                                            .font(.caption)
                                            .padding(.horizontal, 8)
                                            .padding(.vertical, 4)
                                            .background(job.status.swiftUIColor.opacity(0.2))
                                            .foregroundColor(job.status.swiftUIColor)
                                            .cornerRadius(4)
                                        Image(systemName: "chevron.right")
                                            .font(.caption)
                                            .foregroundColor(.gray)
                                    }
                                    .padding(.vertical, 4)
                                }
                            }
                        }
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(12)
                        .shadow(color: .black.opacity(0.05), radius: 5)
                    }
                }
                .padding()
            } else {
                Text("Customer not found")
                    .foregroundColor(.textSecondary)
                    .padding(.top, 50)
            }
        }
        .background(Color.backgroundPrimary)
        .navigationTitle("Customer")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await viewModel.loadCustomerDetail(id: customerId)
        }
    }

    func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: amount)) ?? "$0.00"
    }
}

struct ContactRow: View {
    let icon: String
    let title: String
    let value: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(.primaryOrange)
                    .frame(width: 30)

                VStack(alignment: .leading) {
                    Text(title)
                        .font(.caption)
                        .foregroundColor(.textSecondary)
                    Text(value)
                        .foregroundColor(.textPrimary)
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .foregroundColor(.gray)
            }
        }
    }
}

struct StatBox: View {
    let title: String
    let value: String
    let icon: String

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(.primaryOrange)
            Text(value)
                .font(.headline)
            Text(title)
                .font(.caption)
                .foregroundColor(.textSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(8)
    }
}

// MARK: - New Customer View
struct NewCustomerView: View {
    @Environment(\.dismiss) var dismiss
    var onSave: (() -> Void)?

    // Contact Information
    @State private var firstName = ""
    @State private var lastName = ""
    @State private var companyName = ""
    @State private var email = ""
    @State private var phone = ""
    @State private var alternatePhone = ""
    @State private var preferredContact = "PHONE"
    @State private var source = "WEBSITE"

    // Primary Property
    @State private var address = ""
    @State private var city = ""
    @State private var state = ""
    @State private var zip = ""
    @State private var propertyType = "RESIDENTIAL"

    // Notes
    @State private var notes = ""

    @State private var isSaving = false
    @State private var errorMessage: String?

    let preferredContactOptions = ["PHONE", "EMAIL", "TEXT"]
    let sourceOptions = ["WEBSITE", "REFERRAL", "GOOGLE", "YELP", "FACEBOOK", "WALK_IN", "OTHER"]
    let propertyTypeOptions = ["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL"]

    var body: some View {
        Form {
            Section("Contact Information") {
                TextField("First Name", text: $firstName)
                TextField("Last Name", text: $lastName)
                TextField("Company Name", text: $companyName)
                TextField("Email", text: $email)
                    .keyboardType(.emailAddress)
                    .textContentType(.emailAddress)
                    .autocapitalization(.none)
                TextField("Phone *", text: $phone)
                    .keyboardType(.phonePad)
                    .textContentType(.telephoneNumber)
                TextField("Alternate Phone", text: $alternatePhone)
                    .keyboardType(.phonePad)

                Picker("Preferred Contact", selection: $preferredContact) {
                    ForEach(preferredContactOptions, id: \.self) { option in
                        Text(option.capitalized).tag(option)
                    }
                }

                Picker("Source", selection: $source) {
                    ForEach(sourceOptions, id: \.self) { option in
                        Text(option.replacingOccurrences(of: "_", with: " ").capitalized).tag(option)
                    }
                }
            }

            Section("Primary Property") {
                TextField("Address *", text: $address)
                    .textContentType(.streetAddressLine1)
                TextField("City *", text: $city)
                    .textContentType(.addressCity)
                TextField("State *", text: $state)
                    .textContentType(.addressState)
                    .autocapitalization(.allCharacters)
                TextField("ZIP Code *", text: $zip)
                    .keyboardType(.numberPad)
                    .textContentType(.postalCode)

                Picker("Property Type", selection: $propertyType) {
                    ForEach(propertyTypeOptions, id: \.self) { option in
                        Text(option.capitalized).tag(option)
                    }
                }
            }

            Section("Notes") {
                TextEditor(text: $notes)
                    .frame(minHeight: 100)
            }

            if let error = errorMessage {
                Section {
                    Text(error)
                        .foregroundColor(.red)
                }
            }
        }
        .navigationTitle("New Customer")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button("Cancel") { dismiss() }
            }
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Save") {
                    Task { await saveCustomer() }
                }
                .disabled(!isFormValid || isSaving)
            }
        }
    }

    var isFormValid: Bool {
        !phone.isEmpty && !address.isEmpty && !city.isEmpty && !state.isEmpty && !zip.isEmpty
    }

    func saveCustomer() async {
        isSaving = true
        errorMessage = nil
        do {
            try await CustomerService.shared.createCustomer(
                firstName: firstName,
                lastName: lastName,
                companyName: companyName.isEmpty ? nil : companyName,
                email: email.isEmpty ? nil : email,
                phone: phone,
                alternatePhone: alternatePhone.isEmpty ? nil : alternatePhone,
                preferredContact: preferredContact,
                source: source,
                address: address,
                city: city,
                state: state,
                zip: zip,
                propertyType: propertyType,
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

// MARK: - View Models
@MainActor
class CustomersViewModel: ObservableObject {
    @Published var customers: [Customer] = []
    @Published var isLoading = false
    @Published var error: String?
    @Published var search = ""

    func loadCustomers() async {
        isLoading = true
        do {
            customers = try await CustomerService.shared.getCustomers(search: search)
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }
}

@MainActor
class CustomerDetailViewModel: ObservableObject {
    @Published var customer: Customer?
    @Published var properties: [Property] = []
    @Published var recentJobs: [Job] = []
    @Published var stats: CustomerStats?
    @Published var isLoading = false
    @Published var error: String?

    func loadCustomerDetail(id: String) async {
        isLoading = true
        do {
            let detail = try await CustomerService.shared.getCustomerDetail(id: id)
            customer = detail.customer
            properties = detail.properties
            recentJobs = detail.recentJobs
            stats = detail.stats
        } catch {
            self.error = error.localizedDescription
            // Fallback to basic customer data
            do {
                customer = try await CustomerService.shared.getCustomer(id: id)
            } catch {
                // Ignore secondary error
            }
        }
        isLoading = false
    }
}

#Preview {
    CustomersView()
}
