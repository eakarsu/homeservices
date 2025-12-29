import SwiftUI

// MARK: - Technicians View

struct TechniciansView: View {
    @State private var technicians: [TechnicianItem] = []
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var searchText = ""
    @State private var selectedTechnician: TechnicianItem?

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    ProgressView("Loading technicians...")
                } else if let error = errorMessage {
                    VStack(spacing: 16) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.largeTitle)
                            .foregroundColor(.orange)
                        Text(error)
                            .multilineTextAlignment(.center)
                        Button("Retry") {
                            Task { await loadTechnicians() }
                        }
                        .buttonStyle(.bordered)
                    }
                    .padding()
                } else if filteredTechnicians.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "person.3")
                            .font(.system(size: 50))
                            .foregroundColor(.secondary)
                        Text("No Technicians")
                            .font(.title2)
                            .fontWeight(.semibold)
                        Text("No technicians found")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .padding()
                } else {
                    List(filteredTechnicians) { technician in
                        TechnicianRow(technician: technician)
                            .contentShape(Rectangle())
                            .onTapGesture {
                                selectedTechnician = technician
                            }
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Technicians")
            .searchable(text: $searchText, prompt: "Search technicians...")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    NavigationLink(destination: NewTechnicianView(onSave: {
                        Task { await loadTechnicians() }
                    })) {
                        Image(systemName: "plus")
                    }
                }
            }
            .refreshable {
                await loadTechnicians()
            }
            .sheet(item: $selectedTechnician) { technician in
                TechnicianDetailView(technician: technician) {
                    Task { await loadTechnicians() }
                }
            }
        }
        .task {
            await loadTechnicians()
        }
    }

    private var filteredTechnicians: [TechnicianItem] {
        if searchText.isEmpty {
            return technicians
        }
        return technicians.filter { tech in
            tech.user.name.localizedCaseInsensitiveContains(searchText) ||
            (tech.user.email?.localizedCaseInsensitiveContains(searchText) ?? false)
        }
    }

    private func loadTechnicians() async {
        isLoading = true
        errorMessage = nil

        do {
            technicians = try await TechnicianService.shared.getTechnicians()
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }
}

// MARK: - Technician Row

struct TechnicianRow: View {
    let technician: TechnicianItem

    var body: some View {
        HStack(spacing: 12) {
            // Avatar with color
            Circle()
                .fill(Color(hex: technician.color ?? "#3B82F6").opacity(0.2))
                .frame(width: 50, height: 50)
                .overlay(
                    Text(technician.user.name.prefix(2).uppercased())
                        .font(.headline)
                        .foregroundColor(Color(hex: technician.color ?? "#3B82F6"))
                )

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(technician.user.name)
                        .font(.headline)

                    // Status badge
                    Text(technician.status.replacingOccurrences(of: "_", with: " ").capitalized)
                        .font(.caption2)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(statusColor.opacity(0.2))
                        .foregroundColor(statusColor)
                        .cornerRadius(4)
                }

                // Employee ID
                if let employeeId = technician.employeeId {
                    Text("#\(employeeId)")
                        .font(.caption)
                        .foregroundColor(.textTertiary)
                }

                // Trade Types as badges
                if let tradeTypes = technician.tradeTypes, !tradeTypes.isEmpty {
                    HStack(spacing: 4) {
                        Image(systemName: "wrench.and.screwdriver")
                            .font(.caption2)
                            .foregroundColor(.gray)
                        ForEach(tradeTypes, id: \.self) { trade in
                            Text(trade)
                                .font(.caption2)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(tradeColor(trade).opacity(0.2))
                                .foregroundColor(tradeColor(trade))
                                .cornerRadius(4)
                        }
                    }
                }

                // Truck
                if let truck = technician.truck {
                    HStack(spacing: 4) {
                        Image(systemName: "truck.box")
                            .font(.caption2)
                        Text(truck.name)
                            .font(.caption)
                    }
                    .foregroundColor(.textSecondary)
                }
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 4)
    }

    private func tradeColor(_ trade: String) -> Color {
        switch trade.uppercased() {
        case "HVAC": return .blue
        case "PLUMBING": return .cyan
        case "ELECTRICAL": return .yellow
        case "GENERAL": return .gray
        default: return .purple
        }
    }

    private var statusColor: Color {
        switch technician.status.lowercased() {
        case "available": return .green
        case "busy", "on_job": return .orange
        case "offline": return .gray
        case "on_break": return .yellow
        default: return .blue
        }
    }
}

// MARK: - Technician Detail View

struct TechnicianDetailView: View {
    let technician: TechnicianItem
    let onUpdate: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var isUpdatingStatus = false
    @State private var showStatusPicker = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Profile Header
                    VStack(spacing: 16) {
                        Circle()
                            .fill(Color.blue.opacity(0.2))
                            .frame(width: 80, height: 80)
                            .overlay(
                                Text(technician.user.name.prefix(2).uppercased())
                                    .font(.title)
                                    .foregroundColor(.blue)
                            )

                        Text(technician.user.name)
                            .font(.title2)
                            .fontWeight(.bold)

                        if let email = technician.user.email {
                            Text(email)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }

                        Button(action: { showStatusPicker = true }) {
                            HStack {
                                Circle()
                                    .fill(statusColor)
                                    .frame(width: 10, height: 10)
                                Text(technician.status.capitalized)
                                Image(systemName: "chevron.down")
                                    .font(.caption)
                            }
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(Color(.systemGray6))
                            .cornerRadius(20)
                        }
                        .buttonStyle(.plain)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)

                    // Performance Stats
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Performance")
                            .font(.headline)

                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                            TechStatCard(title: "Jobs Completed", value: "\(technician.jobsCompleted ?? 0)", icon: "checkmark.circle.fill", color: .green)
                            TechStatCard(title: "Avg Rating", value: String(format: "%.1f", technician.averageRating ?? 0), icon: "star.fill", color: .yellow)
                            TechStatCard(title: "Hourly Rate", value: formatCurrency(technician.hourlyRate ?? 0), icon: "dollarsign.circle.fill", color: .primaryOrange)
                            TechStatCard(title: "Pay Type", value: technician.payType?.capitalized ?? "N/A", icon: "banknote.fill", color: .blue)
                        }
                    }

                    // Contact Info
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Contact")
                            .font(.headline)

                        if let phone = technician.user.phone {
                            Button(action: {
                                if let url = URL(string: "tel:\(phone)") {
                                    UIApplication.shared.open(url)
                                }
                            }) {
                                HStack {
                                    Image(systemName: "phone.fill")
                                        .foregroundColor(.primaryOrange)
                                    Text(phone)
                                        .foregroundColor(.textPrimary)
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .foregroundColor(.gray)
                                }
                            }
                            .padding()
                            .background(Color(.systemGray6))
                            .cornerRadius(12)
                        }

                        if let email = technician.user.email {
                            Button(action: {
                                if let url = URL(string: "mailto:\(email)") {
                                    UIApplication.shared.open(url)
                                }
                            }) {
                                HStack {
                                    Image(systemName: "envelope.fill")
                                        .foregroundColor(.primaryOrange)
                                    Text(email)
                                        .foregroundColor(.textPrimary)
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .foregroundColor(.gray)
                                }
                            }
                            .padding()
                            .background(Color(.systemGray6))
                            .cornerRadius(12)
                        }
                    }

                    // Skills
                    if !technician.skills.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Skills")
                                .font(.headline)

                            FlowLayout(spacing: 8) {
                                ForEach(technician.skills, id: \.self) { skill in
                                    Text(skill)
                                        .font(.caption)
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 6)
                                        .background(Color.blue.opacity(0.2))
                                        .foregroundColor(.blue)
                                        .cornerRadius(16)
                                }
                            }
                        }
                    }

                    // Truck Info
                    if let truck = technician.truck {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Assigned Vehicle")
                                .font(.headline)

                            HStack {
                                Image(systemName: "car.fill")
                                    .foregroundColor(.blue)
                                Text(truck.name)
                                    .fontWeight(.medium)
                            }
                            .padding()
                            .background(Color(.systemGray6))
                            .cornerRadius(12)
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("Technician")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
            .confirmationDialog("Update Status", isPresented: $showStatusPicker) {
                Button("Available") { updateStatus("available") }
                Button("Busy") { updateStatus("busy") }
                Button("On Break") { updateStatus("on_break") }
                Button("Offline") { updateStatus("offline") }
                Button("Cancel", role: .cancel) {}
            }
        }
    }

    private var statusColor: Color {
        switch technician.status.lowercased() {
        case "available": return .green
        case "busy", "on_job": return .orange
        case "offline": return .gray
        case "on_break": return .yellow
        default: return .blue
        }
    }

    private func updateStatus(_ status: String) {
        Task {
            isUpdatingStatus = true
            do {
                _ = try await TechnicianService.shared.updateStatus(id: technician.id, status: status)
                onUpdate()
                dismiss()
            } catch {
                // Handle error
            }
            isUpdatingStatus = false
        }
    }
}

// MARK: - Tech Stat Card

struct TechStatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
            Text(value)
                .font(.headline)
                .fontWeight(.bold)
            Text(title)
                .font(.caption)
                .foregroundColor(.textSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

private func formatCurrency(_ amount: Double) -> String {
    let formatter = NumberFormatter()
    formatter.numberStyle = .currency
    formatter.currencyCode = "USD"
    return formatter.string(from: NSNumber(value: amount)) ?? "$0.00"
}

// MARK: - Flow Layout

struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = FlowResult(in: proposal.width ?? 0, subviews: subviews, spacing: spacing)
        return CGSize(width: proposal.width ?? 0, height: result.height)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = FlowResult(in: bounds.width, subviews: subviews, spacing: spacing)
        for (index, subview) in subviews.enumerated() {
            subview.place(at: CGPoint(x: bounds.minX + result.positions[index].x,
                                       y: bounds.minY + result.positions[index].y),
                          proposal: .unspecified)
        }
    }

    struct FlowResult {
        var positions: [CGPoint] = []
        var height: CGFloat = 0

        init(in width: CGFloat, subviews: Subviews, spacing: CGFloat) {
            var x: CGFloat = 0
            var y: CGFloat = 0
            var rowHeight: CGFloat = 0

            for subview in subviews {
                let size = subview.sizeThatFits(.unspecified)

                if x + size.width > width && x > 0 {
                    x = 0
                    y += rowHeight + spacing
                    rowHeight = 0
                }

                positions.append(CGPoint(x: x, y: y))
                rowHeight = max(rowHeight, size.height)
                x += size.width + spacing
            }

            height = y + rowHeight
        }
    }
}

// MARK: - New Technician View

struct NewTechnicianView: View {
    @Environment(\.dismiss) var dismiss
    var onSave: (() -> Void)?

    // Personal Info
    @State private var firstName = ""
    @State private var lastName = ""
    @State private var email = ""
    @State private var phone = ""
    @State private var password = ""
    @State private var employeeId = ""

    // Skills
    @State private var selectedTradeTypes: Set<String> = []
    @State private var certifications = ""

    // Compensation
    @State private var payType = "HOURLY"
    @State private var hourlyRate = ""

    // Calendar Color
    @State private var selectedColor = "#3B82F6"

    @State private var isSaving = false
    @State private var errorMessage: String?

    let tradeTypes = ["HVAC", "PLUMBING", "ELECTRICAL", "GENERAL"]
    let payTypes = ["HOURLY", "SALARY", "COMMISSION"]
    let colors = [
        ("Blue", "#3B82F6"),
        ("Green", "#10B981"),
        ("Yellow", "#F59E0B"),
        ("Purple", "#8B5CF6"),
        ("Pink", "#EC4899"),
        ("Indigo", "#6366F1"),
        ("Teal", "#14B8A6"),
        ("Orange", "#F97316")
    ]

    var body: some View {
        Form {
            Section("Personal Information") {
                TextField("First Name *", text: $firstName)
                TextField("Last Name *", text: $lastName)
                TextField("Email *", text: $email)
                    .keyboardType(.emailAddress)
                    .textContentType(.emailAddress)
                    .autocapitalization(.none)
                TextField("Phone", text: $phone)
                    .keyboardType(.phonePad)
                SecureField("Password", text: $password)
                TextField("Employee ID", text: $employeeId)
            }

            Section("Skills & Certifications") {
                Text("Trade Types *")
                    .font(.subheadline)
                    .foregroundColor(.textSecondary)
                FlowLayout(spacing: 8) {
                    ForEach(tradeTypes, id: \.self) { trade in
                        TradeTypeButton(
                            title: trade,
                            isSelected: selectedTradeTypes.contains(trade)
                        ) {
                            if selectedTradeTypes.contains(trade) {
                                selectedTradeTypes.remove(trade)
                            } else {
                                selectedTradeTypes.insert(trade)
                            }
                        }
                    }
                }

                TextField("Certifications (comma-separated)", text: $certifications)
            }

            Section("Compensation") {
                Picker("Pay Type", selection: $payType) {
                    ForEach(payTypes, id: \.self) { type in
                        Text(type.capitalized).tag(type)
                    }
                }

                if payType == "HOURLY" {
                    TextField("Hourly Rate", text: $hourlyRate)
                        .keyboardType(.decimalPad)
                }
            }

            Section("Calendar Color") {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 44))], spacing: 8) {
                    ForEach(colors, id: \.1) { color in
                        Circle()
                            .fill(Color(hex: color.1))
                            .frame(width: 44, height: 44)
                            .overlay(
                                Circle()
                                    .stroke(selectedColor == color.1 ? Color.primary : Color.clear, lineWidth: 3)
                            )
                            .onTapGesture {
                                selectedColor = color.1
                            }
                    }
                }
            }

            if let error = errorMessage {
                Section {
                    Text(error)
                        .foregroundColor(.red)
                }
            }
        }
        .navigationTitle("New Technician")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button("Cancel") { dismiss() }
            }
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Save") {
                    Task { await saveTechnician() }
                }
                .disabled(!isFormValid || isSaving)
            }
        }
    }

    var isFormValid: Bool {
        !firstName.isEmpty && !lastName.isEmpty && !email.isEmpty && !selectedTradeTypes.isEmpty
    }

    func saveTechnician() async {
        isSaving = true
        errorMessage = nil
        do {
            try await TechnicianService.shared.createTechnician(
                firstName: firstName,
                lastName: lastName,
                email: email,
                phone: phone.isEmpty ? nil : phone,
                password: password.isEmpty ? nil : password,
                employeeId: employeeId.isEmpty ? nil : employeeId,
                tradeTypes: Array(selectedTradeTypes),
                certifications: certifications.isEmpty ? nil : certifications.split(separator: ",").map { String($0.trimmingCharacters(in: .whitespaces)) },
                payType: payType,
                hourlyRate: Double(hourlyRate),
                color: selectedColor
            )
            onSave?()
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
        isSaving = false
    }
}

struct TradeTypeButton: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(isSelected ? Color.primaryOrange : Color.backgroundSecondary)
                .foregroundColor(isSelected ? .white : .textPrimary)
                .cornerRadius(8)
        }
    }
}

#Preview {
    TechniciansView()
}
