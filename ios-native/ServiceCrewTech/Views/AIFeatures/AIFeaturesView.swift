import SwiftUI

// MARK: - AI Feature Definition

struct AIFeature: Identifiable {
    let id = UUID()
    let name: String
    let description: String
    let icon: String
    let color: Color
    let stats: [(label: String, value: String)]
    let endpoint: String
}

let aiFeatures: [AIFeature] = [
    AIFeature(
        name: "Dispatch Optimizer",
        description: "Automatically assign jobs to technicians based on location, skills, and availability. Optimize routes and reduce travel time.",
        icon: "truck.box.fill",
        color: .blue,
        stats: [("Avg Time Saved", "25%"), ("Fuel Savings", "15%")],
        endpoint: "dispatch-optimizer"
    ),
    AIFeature(
        name: "Diagnostics Assistant",
        description: "Get AI-powered diagnostic suggestions based on symptoms. Identify probable causes and recommended repair actions.",
        icon: "wrench.and.screwdriver.fill",
        color: .green,
        stats: [("Accuracy Rate", "92%"), ("Time to Diagnose", "-40%")],
        endpoint: "diagnostics"
    ),
    AIFeature(
        name: "Smart Scheduling",
        description: "AI-powered appointment scheduling that considers travel time, job complexity, technician skills, and customer preferences.",
        icon: "calendar.badge.clock",
        color: .purple,
        stats: [("Schedule Efficiency", "+30%"), ("Customer Satisfaction", "95%")],
        endpoint: "smart-scheduling"
    ),
    AIFeature(
        name: "Predictive Maintenance",
        description: "Predict equipment failures before they happen based on age, service history, and usage patterns. Prevent costly breakdowns.",
        icon: "chart.bar.fill",
        color: .orange,
        stats: [("Failure Prevention", "85%"), ("Cost Savings", "40%")],
        endpoint: "predictive-maintenance"
    ),
    AIFeature(
        name: "Customer Insights",
        description: "AI-powered customer analysis to identify VIPs, churn risks, and upsell opportunities. Maximize customer lifetime value.",
        icon: "person.2.fill",
        color: .pink,
        stats: [("Retention Boost", "+20%"), ("Revenue Growth", "+15%")],
        endpoint: "customer-insights"
    ),
    AIFeature(
        name: "Quote Generator",
        description: "Generate professional Good/Better/Best quotes instantly. AI calculates pricing based on service type, parts, and labor.",
        icon: "doc.text.fill",
        color: .indigo,
        stats: [("Quote Time", "-80%"), ("Win Rate", "+25%")],
        endpoint: "quote-generator"
    ),
    AIFeature(
        name: "Job Summary",
        description: "Transform technician notes into professional job reports. Auto-generate customer communications and follow-up recommendations.",
        icon: "clipboard.fill",
        color: .teal,
        stats: [("Report Quality", "+50%"), ("Admin Time", "-60%")],
        endpoint: "job-summary"
    ),
    AIFeature(
        name: "Inventory Forecast",
        description: "Predict inventory needs and optimize reorder timing. Prevent stockouts and reduce carrying costs with AI-powered forecasting.",
        icon: "shippingbox.fill",
        color: Color(red: 0.96, green: 0.76, blue: 0.0), // amber
        stats: [("Stockout Reduction", "-70%"), ("Inventory Savings", "+20%")],
        endpoint: "inventory-forecast"
    )
]

// MARK: - AI Features View

struct AIFeaturesView: View {
    @State private var selectedFeature: AIFeature?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Header
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Image(systemName: "sparkles")
                                .font(.title)
                                .foregroundColor(.primaryOrange)
                            Text("AI Features")
                                .font(.title)
                                .fontWeight(.bold)
                                .foregroundColor(.textPrimary)
                        }

                        Text("Leverage artificial intelligence to optimize your field service operations")
                            .font(.subheadline)
                            .foregroundColor(.textSecondary)
                    }
                    .padding(.horizontal)

                    // Features Grid
                    LazyVStack(spacing: 16) {
                        ForEach(aiFeatures) { feature in
                            Button {
                                selectedFeature = feature
                            } label: {
                                AIFeatureCard(feature: feature)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal)

                    // AI Info Card
                    VStack(alignment: .leading, spacing: 12) {
                        HStack(spacing: 12) {
                            Image(systemName: "sparkles")
                                .font(.system(size: 32))
                                .foregroundColor(.primaryOrange)

                            VStack(alignment: .leading, spacing: 4) {
                                Text("Powered by Advanced AI")
                                    .font(.headline)
                                    .foregroundColor(.textPrimary)
                                Text("Our AI features use state-of-the-art language models to provide accurate diagnostics, optimal scheduling, predictive insights, and intelligent recommendations. All data is processed securely.")
                                    .font(.caption)
                                    .foregroundColor(.textSecondary)
                            }
                        }
                    }
                    .padding()
                    .background(
                        LinearGradient(
                            colors: [Color.primaryOrange.opacity(0.1), Color.blue.opacity(0.1)],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .cornerRadius(12)
                    .padding(.horizontal)

                    // Quick Actions
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Quick Actions")
                            .font(.headline)
                            .foregroundColor(.textPrimary)
                            .padding(.horizontal)

                        LazyVGrid(columns: [
                            GridItem(.flexible(), spacing: 12),
                            GridItem(.flexible(), spacing: 12),
                            GridItem(.flexible(), spacing: 12),
                            GridItem(.flexible(), spacing: 12)
                        ], spacing: 12) {
                            QuickActionButton(icon: "truck.box.fill", label: "Optimize Dispatch", color: .blue) {
                                selectedFeature = aiFeatures[0]
                            }
                            QuickActionButton(icon: "wrench.and.screwdriver.fill", label: "Diagnose Issue", color: .green) {
                                selectedFeature = aiFeatures[1]
                            }
                            QuickActionButton(icon: "doc.text.fill", label: "Generate Quote", color: .indigo) {
                                selectedFeature = aiFeatures[5]
                            }
                            QuickActionButton(icon: "person.2.fill", label: "Customer Insights", color: .pink) {
                                selectedFeature = aiFeatures[4]
                            }
                        }
                        .padding(.horizontal)
                    }
                }
                .padding(.vertical)
            }
            .navigationTitle("")
            .navigationBarTitleDisplayMode(.inline)
            .sheet(item: $selectedFeature) { feature in
                NavigationStack {
                    featureView(for: feature)
                        .navigationTitle(feature.name)
                        .navigationBarTitleDisplayMode(.inline)
                        .toolbar {
                            ToolbarItem(placement: .navigationBarTrailing) {
                                Button("Done") {
                                    selectedFeature = nil
                                }
                            }
                        }
                }
            }
        }
    }

    @ViewBuilder
    func featureView(for feature: AIFeature) -> some View {
        switch feature.endpoint {
        case "dispatch-optimizer":
            AIDispatchOptimizerView()
        case "diagnostics":
            AIDiagnosticsView()
        case "smart-scheduling":
            AISmartSchedulingView()
        case "predictive-maintenance":
            AIPredictiveMaintenanceView()
        case "customer-insights":
            AICustomerInsightsView()
        case "quote-generator":
            AIQuoteGeneratorView()
        case "job-summary":
            AIJobSummaryView()
        case "inventory-forecast":
            AIInventoryForecastView()
        default:
            AIGenericFeatureView(feature: feature)
        }
    }
}

// MARK: - AI Feature Card

struct AIFeatureCard: View {
    let feature: AIFeature

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // Icon
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(feature.color)
                    .frame(width: 48, height: 48)

                Image(systemName: feature.icon)
                    .font(.system(size: 22))
                    .foregroundColor(.white)
            }

            // Content
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(feature.name)
                        .font(.headline)
                        .foregroundColor(.textPrimary)
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .foregroundColor(.textTertiary)
                }

                Text(feature.description)
                    .font(.caption)
                    .foregroundColor(.textSecondary)
                    .lineLimit(2)

                // Stats
                HStack(spacing: 24) {
                    ForEach(feature.stats.indices, id: \.self) { index in
                        VStack(spacing: 2) {
                            Text(feature.stats[index].value)
                                .font(.title3)
                                .fontWeight(.bold)
                                .foregroundColor(.primaryOrange)
                            Text(feature.stats[index].label)
                                .font(.caption2)
                                .foregroundColor(.textTertiary)
                        }
                    }
                    Spacer()
                }
                .padding(.top, 4)
            }
        }
        .padding()
        .background(Color.backgroundSecondary)
        .cornerRadius(16)
    }
}

// MARK: - Quick Action Button

struct QuickActionButton: View {
    let icon: String
    let label: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)

                Text(label)
                    .font(.caption2)
                    .fontWeight(.medium)
                    .foregroundColor(.textPrimary)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(Color.backgroundSecondary)
            .cornerRadius(12)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - AI Dispatch Optimizer View

struct AIDispatchOptimizerView: View {
    @StateObject private var viewModel = AIDispatchOptimizerViewModel()

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Load Sample Data Button
                HStack {
                    Spacer()
                    Button {
                        viewModel.loadSampleData()
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "beaker.fill")
                            Text("Load Sample Data")
                        }
                        .font(.caption)
                        .foregroundColor(.primaryOrange)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.primaryOrange.opacity(0.1))
                        .clipShape(Capsule())
                    }
                }
                .padding(.horizontal)

                AIFeatureHeader(
                    icon: "truck.box.fill",
                    title: "Dispatch Optimizer",
                    description: "Automatically optimize job assignments based on location, skills, and availability"
                )

                // Stats Cards
                HStack(spacing: 12) {
                    AIStatCard(value: "\(viewModel.availableTechs)", label: "Available Techs", color: .blue)
                    AIStatCard(value: "\(viewModel.unassignedJobs)", label: "Unassigned Jobs", color: .orange)
                }
                .padding(.horizontal)

                // Date Picker
                VStack(alignment: .leading, spacing: 8) {
                    Text("Select Date")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.textPrimary)

                    DatePicker("", selection: $viewModel.selectedDate, displayedComponents: .date)
                        .datePickerStyle(.compact)
                        .labelsHidden()
                }
                .padding(.horizontal)

                Button {
                    Task { await viewModel.optimize() }
                } label: {
                    AIActionButton(text: "Optimize Dispatch", isLoading: viewModel.isLoading)
                }
                .disabled(viewModel.unassignedJobs == 0 || viewModel.availableTechs == 0)
                .padding(.horizontal)

                if let result = viewModel.result {
                    AIResultCard(title: "Optimization Results", content: result)
                        .padding(.horizontal)
                }
            }
            .padding(.vertical)
        }
    }
}

// MARK: - AI Diagnostics View

struct AIDiagnosticsView: View {
    @StateObject private var viewModel = AIDiagnosticsViewModel()

    let trades = ["HVAC", "Plumbing", "Electrical", "Appliance"]

    let sampleSymptoms: [(String, String)] = [
        ("HVAC", "AC not cooling, warm air coming from vents, outdoor unit running but indoor fan not working, ice buildup on refrigerant lines"),
        ("Plumbing", "Low water pressure throughout house, gurgling sounds in drains, slow draining in multiple fixtures"),
        ("Electrical", "Flickering lights, burning smell near outlet, circuit breaker keeps tripping, outlets not working in one room"),
        ("Appliance", "Refrigerator not cooling, making clicking noise, ice buildup in freezer, water pooling underneath")
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Load Example
                HStack {
                    Spacer()
                    Button {
                        let sample = sampleSymptoms.randomElement()!
                        viewModel.selectedTrade = sample.0
                        viewModel.symptoms = sample.1
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "shuffle")
                            Text("Load Example")
                        }
                        .font(.caption)
                        .foregroundColor(.primaryOrange)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.primaryOrange.opacity(0.1))
                        .clipShape(Capsule())
                    }
                }
                .padding(.horizontal)

                AIFeatureHeader(
                    icon: "wrench.and.screwdriver.fill",
                    title: "Diagnostics Assistant",
                    description: "Get AI-powered troubleshooting assistance"
                )

                // Trade Selection
                VStack(alignment: .leading, spacing: 8) {
                    Text("Trade Type")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.textPrimary)

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(trades, id: \.self) { trade in
                                FilterChipView(label: trade, isSelected: viewModel.selectedTrade == trade) {
                                    viewModel.selectedTrade = trade
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal)

                // Symptoms Input
                VStack(alignment: .leading, spacing: 8) {
                    Text("Describe Symptoms")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.textPrimary)

                    TextEditor(text: $viewModel.symptoms)
                        .frame(height: 100)
                        .padding(8)
                        .background(Color.backgroundSecondary)
                        .cornerRadius(8)
                }
                .padding(.horizontal)

                Button {
                    Task { await viewModel.diagnose() }
                } label: {
                    AIActionButton(text: "Get Diagnosis", isLoading: viewModel.isLoading)
                }
                .disabled(viewModel.symptoms.isEmpty)
                .padding(.horizontal)

                // Results
                if let result = viewModel.result {
                    VStack(alignment: .leading, spacing: 12) {
                        if let causes = result.possibleCauses, !causes.isEmpty {
                            DiagnosticSection(
                                title: "Possible Causes",
                                items: causes.map { "\($0.cause) (\($0.probability)%): \($0.explanation)" },
                                icon: "exclamationmark.triangle.fill",
                                color: .secondaryYellow
                            )
                        }

                        if let actions = result.recommendedActions, !actions.isEmpty {
                            DiagnosticSection(
                                title: "Recommended Actions",
                                items: actions.map { "\($0.action) - \($0.priority) priority (~\($0.estimatedTime) min)" },
                                icon: "list.number",
                                color: .secondaryBlue
                            )
                        }

                        if let warnings = result.safetyWarnings, !warnings.isEmpty {
                            DiagnosticSection(title: "Safety Warnings", items: warnings, icon: "exclamationmark.shield.fill", color: .primaryOrange)
                        }

                        if let cost = result.estimatedRepairCost {
                            HStack {
                                Image(systemName: "dollarsign.circle.fill")
                                    .foregroundColor(.secondaryGreen)
                                Text("Estimated Cost: $\(Int(cost.low)) - $\(Int(cost.high))")
                                    .font(.subheadline)
                                    .foregroundColor(.textPrimary)
                            }
                            .padding()
                            .background(Color.backgroundSecondary)
                            .cornerRadius(12)
                        }
                    }
                    .padding(.horizontal)
                }

                if let error = viewModel.error {
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.primaryOrange)
                        .padding()
                }
            }
            .padding(.vertical)
        }
    }
}

// MARK: - AI Smart Scheduling View

struct AISmartSchedulingView: View {
    @StateObject private var viewModel = AISmartSchedulingViewModel()

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Load Sample Data
                HStack {
                    Spacer()
                    Button {
                        viewModel.loadSampleData()
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "beaker.fill")
                            Text("Load Sample Data")
                        }
                        .font(.caption)
                        .foregroundColor(.primaryOrange)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.primaryOrange.opacity(0.1))
                        .clipShape(Capsule())
                    }
                }
                .padding(.horizontal)

                AIFeatureHeader(
                    icon: "calendar.badge.clock",
                    title: "Smart Scheduling",
                    description: "AI-powered appointment scheduling considering travel time and preferences"
                )

                // Customer Selection
                VStack(alignment: .leading, spacing: 8) {
                    Text("Customer")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.textPrimary)

                    TextField("Customer name or search", text: $viewModel.customerName)
                        .textFieldStyle(.roundedBorder)
                }
                .padding(.horizontal)

                // Service Type
                VStack(alignment: .leading, spacing: 8) {
                    Text("Service Type")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.textPrimary)

                    Picker("Service", selection: $viewModel.serviceType) {
                        Text("AC Repair (90 min)").tag("AC Repair")
                        Text("Annual Maintenance (60 min)").tag("Annual Maintenance")
                        Text("Thermostat Install (45 min)").tag("Thermostat Install")
                        Text("Duct Cleaning (120 min)").tag("Duct Cleaning")
                    }
                    .pickerStyle(.menu)
                    .padding()
                    .background(Color.backgroundSecondary)
                    .cornerRadius(8)
                }
                .padding(.horizontal)

                // Preferred Date
                VStack(alignment: .leading, spacing: 8) {
                    Text("Preferred Date")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.textPrimary)

                    DatePicker("", selection: $viewModel.preferredDate, displayedComponents: .date)
                        .datePickerStyle(.compact)
                        .labelsHidden()
                }
                .padding(.horizontal)

                // Preferred Time
                VStack(alignment: .leading, spacing: 8) {
                    Text("Preferred Time")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.textPrimary)

                    HStack(spacing: 8) {
                        ForEach(["Morning", "Afternoon", "Evening"], id: \.self) { time in
                            FilterChipView(label: time, isSelected: viewModel.preferredTime == time) {
                                viewModel.preferredTime = time
                            }
                        }
                    }
                }
                .padding(.horizontal)

                Button {
                    Task { await viewModel.findSlots() }
                } label: {
                    AIActionButton(text: "Find Best Appointment Slots", isLoading: viewModel.isLoading)
                }
                .disabled(viewModel.customerName.isEmpty)
                .padding(.horizontal)

                if let result = viewModel.result {
                    AIResultCard(title: "Recommended Slots", content: result)
                        .padding(.horizontal)
                }
            }
            .padding(.vertical)
        }
    }
}

// MARK: - AI Predictive Maintenance View

struct AIPredictiveMaintenanceView: View {
    @StateObject private var viewModel = AIPredictiveMaintenanceViewModel()

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Load Sample Data
                HStack {
                    Spacer()
                    Button {
                        viewModel.loadSampleData()
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "beaker.fill")
                            Text("Load Sample Data")
                        }
                        .font(.caption)
                        .foregroundColor(.primaryOrange)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.primaryOrange.opacity(0.1))
                        .clipShape(Capsule())
                    }
                }
                .padding(.horizontal)

                AIFeatureHeader(
                    icon: "chart.bar.fill",
                    title: "Predictive Maintenance",
                    description: "Predict equipment failures before they happen"
                )

                // Equipment Type
                VStack(alignment: .leading, spacing: 8) {
                    Text("Equipment Type")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.textPrimary)

                    Picker("Equipment", selection: $viewModel.equipmentType) {
                        Text("Central AC Unit").tag("Central AC Unit")
                        Text("Furnace").tag("Furnace")
                        Text("Heat Pump").tag("Heat Pump")
                        Text("Water Heater").tag("Water Heater")
                        Text("Boiler").tag("Boiler")
                    }
                    .pickerStyle(.menu)
                    .padding()
                    .background(Color.backgroundSecondary)
                    .cornerRadius(8)
                }
                .padding(.horizontal)

                // Equipment Age
                VStack(alignment: .leading, spacing: 8) {
                    Text("Equipment Age (Years)")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.textPrimary)

                    TextField("e.g., 8", text: $viewModel.equipmentAge)
                        .textFieldStyle(.roundedBorder)
                        .keyboardType(.numberPad)
                }
                .padding(.horizontal)

                // Last Service Date
                VStack(alignment: .leading, spacing: 8) {
                    Text("Last Service Date")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.textPrimary)

                    DatePicker("", selection: $viewModel.lastServiceDate, displayedComponents: .date)
                        .datePickerStyle(.compact)
                        .labelsHidden()
                }
                .padding(.horizontal)

                // Service History Notes
                VStack(alignment: .leading, spacing: 8) {
                    Text("Service History Notes")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.textPrimary)

                    TextEditor(text: $viewModel.serviceHistory)
                        .frame(height: 80)
                        .padding(8)
                        .background(Color.backgroundSecondary)
                        .cornerRadius(8)
                }
                .padding(.horizontal)

                Button {
                    Task { await viewModel.predict() }
                } label: {
                    AIActionButton(text: "Predict Maintenance Needs", isLoading: viewModel.isLoading)
                }
                .padding(.horizontal)

                if let result = viewModel.result {
                    AIResultCard(title: "Maintenance Predictions", content: result)
                        .padding(.horizontal)
                }
            }
            .padding(.vertical)
        }
    }
}

// MARK: - AI Customer Insights View

struct AICustomerInsightsView: View {
    @StateObject private var viewModel = AICustomerInsightsViewModel()
    @State private var searchText = ""

    var filteredCustomers: [Customer] {
        if searchText.isEmpty {
            return viewModel.customers
        }
        return viewModel.customers.filter { customer in
            let fullName = "\(customer.firstName ?? "") \(customer.lastName ?? "")".lowercased()
            return fullName.contains(searchText.lowercased()) ||
                   (customer.email?.lowercased().contains(searchText.lowercased()) ?? false)
        }
    }

    func customerInitials(_ customer: Customer) -> String {
        let first = customer.firstName?.prefix(1) ?? ""
        let last = customer.lastName?.prefix(1) ?? ""
        return "\(first)\(last)"
    }

    func customerFullName(_ customer: Customer) -> String {
        "\(customer.firstName ?? "") \(customer.lastName ?? "")"
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                AIFeatureHeader(
                    icon: "person.2.fill",
                    title: "Customer Insights",
                    description: "Analyze customer history and preferences"
                )

                // Customer Selection Section
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text("Select Customer")
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .foregroundColor(.textPrimary)
                        Spacer()
                        if !viewModel.customers.isEmpty {
                            Text("\(viewModel.customers.count) customers")
                                .font(.caption)
                                .foregroundColor(.textTertiary)
                        }
                    }

                    if viewModel.isLoadingCustomers {
                        HStack(spacing: 12) {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle())
                            Text("Loading customers...")
                                .font(.subheadline)
                                .foregroundColor(.textSecondary)
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.backgroundSecondary)
                        .cornerRadius(12)
                    } else if viewModel.customers.isEmpty {
                        VStack(spacing: 8) {
                            Image(systemName: "person.slash")
                                .font(.system(size: 32))
                                .foregroundColor(.textTertiary)
                            Text("No customers found")
                                .font(.subheadline)
                                .foregroundColor(.textSecondary)
                            Text("Add customers to analyze their insights")
                                .font(.caption)
                                .foregroundColor(.textTertiary)
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.backgroundSecondary)
                        .cornerRadius(12)
                    } else {
                        // Search field
                        HStack {
                            Image(systemName: "magnifyingglass")
                                .foregroundColor(.textTertiary)
                            TextField("Search customers...", text: $searchText)
                                .font(.subheadline)
                        }
                        .padding(12)
                        .background(Color.backgroundSecondary)
                        .cornerRadius(10)

                        // Customer List
                        VStack(spacing: 0) {
                            ForEach(filteredCustomers.prefix(5), id: \.id) { customer in
                                CustomerSelectRow(
                                    customer: customer,
                                    isSelected: viewModel.selectedCustomerId == customer.id
                                ) {
                                    viewModel.selectedCustomerId = customer.id
                                }
                                if customer.id != filteredCustomers.prefix(5).last?.id {
                                    Divider()
                                        .padding(.leading, 52)
                                }
                            }
                        }
                        .background(Color.backgroundSecondary)
                        .cornerRadius(12)

                        if filteredCustomers.count > 5 {
                            Text("Showing 5 of \(filteredCustomers.count) customers. Use search to find more.")
                                .font(.caption)
                                .foregroundColor(.textTertiary)
                        }
                    }
                }
                .padding(.horizontal)

                // Selected Customer Info
                if let customer = viewModel.selectedCustomer {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.secondaryGreen)
                            Text("Selected Customer")
                                .font(.caption)
                                .fontWeight(.medium)
                                .foregroundColor(.secondaryGreen)
                        }

                        HStack(spacing: 12) {
                            ZStack {
                                Circle()
                                    .fill(Color.pink.opacity(0.2))
                                    .frame(width: 44, height: 44)
                                Text(customerInitials(customer))
                                    .font(.headline)
                                    .foregroundColor(.pink)
                            }

                            VStack(alignment: .leading, spacing: 2) {
                                Text(customerFullName(customer))
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                    .foregroundColor(.textPrimary)
                                if let email = customer.email {
                                    Text(email)
                                        .font(.caption)
                                        .foregroundColor(.textSecondary)
                                }
                            }
                            Spacer()
                        }
                    }
                    .padding()
                    .background(Color.secondaryGreen.opacity(0.1))
                    .cornerRadius(12)
                    .padding(.horizontal)
                }

                Button {
                    Task { await viewModel.analyze() }
                } label: {
                    AIActionButton(text: "Analyze Customer", isLoading: viewModel.isLoading)
                }
                .disabled(viewModel.selectedCustomerId.isEmpty || viewModel.isLoading)
                .padding(.horizontal)

                if let result = viewModel.result {
                    AIResultCard(title: "Customer Analysis", content: result)
                        .padding(.horizontal)
                }
            }
            .padding(.vertical)
        }
        .task {
            await viewModel.loadCustomers()
        }
    }
}

// MARK: - Customer Select Row

struct CustomerSelectRow: View {
    let customer: Customer
    let isSelected: Bool
    let onSelect: () -> Void

    private var initials: String {
        let first = customer.firstName?.prefix(1) ?? ""
        let last = customer.lastName?.prefix(1) ?? ""
        return "\(first)\(last)"
    }

    private var fullName: String {
        "\(customer.firstName ?? "") \(customer.lastName ?? "")"
    }

    var body: some View {
        Button(action: onSelect) {
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(isSelected ? Color.pink : Color.pink.opacity(0.2))
                        .frame(width: 40, height: 40)
                    Text(initials)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(isSelected ? .white : .pink)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(fullName)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.textPrimary)
                    if let email = customer.email {
                        Text(email)
                            .font(.caption)
                            .foregroundColor(.textSecondary)
                    }
                }

                Spacer()

                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.pink)
                }
            }
            .padding(12)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}

// MARK: - AI Quote Generator View

struct AIQuoteGeneratorView: View {
    @StateObject private var viewModel = AIQuoteGeneratorViewModel()

    let sampleJobs: [(String, String)] = [
        ("Replace 3-ton central AC unit including condenser, evaporator coil, and refrigerant lines. Residential single-story home.", "HVAC"),
        ("Install new 50-gallon water heater, replace old supply lines, and add expansion tank. Includes permit.", "Plumbing"),
        ("Upgrade electrical panel from 100A to 200A service. Install new main breaker and rewire circuits.", "Electrical"),
        ("Diagnose and repair refrigerator not cooling. Customer reports warm fridge but freezer works.", "Appliance")
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Load Example
                HStack {
                    Spacer()
                    Button {
                        let sample = sampleJobs.randomElement()!
                        viewModel.jobDescription = sample.0
                        viewModel.tradeType = sample.1
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "shuffle")
                            Text("Load Example")
                        }
                        .font(.caption)
                        .foregroundColor(.primaryOrange)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.primaryOrange.opacity(0.1))
                        .clipShape(Capsule())
                    }
                }
                .padding(.horizontal)

                AIFeatureHeader(
                    icon: "doc.text.fill",
                    title: "Quote Generator",
                    description: "Generate accurate quotes based on job details"
                )

                VStack(alignment: .leading, spacing: 8) {
                    Text("Job Description")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.textPrimary)

                    TextEditor(text: $viewModel.jobDescription)
                        .frame(height: 100)
                        .padding(8)
                        .background(Color.backgroundSecondary)
                        .cornerRadius(8)
                }
                .padding(.horizontal)

                VStack(alignment: .leading, spacing: 8) {
                    Text("Trade Type")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.textPrimary)

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(["HVAC", "Plumbing", "Electrical", "Appliance"], id: \.self) { trade in
                                FilterChipView(label: trade, isSelected: viewModel.tradeType == trade) {
                                    viewModel.tradeType = trade
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal)

                Button {
                    Task { await viewModel.generateQuote() }
                } label: {
                    AIActionButton(text: "Generate Quote", isLoading: viewModel.isLoading)
                }
                .disabled(viewModel.jobDescription.isEmpty)
                .padding(.horizontal)

                if let result = viewModel.result {
                    AIResultCard(title: "Generated Quote", content: result)
                        .padding(.horizontal)
                }
            }
            .padding(.vertical)
        }
    }
}

// MARK: - AI Job Summary View

struct AIJobSummaryView: View {
    @StateObject private var viewModel = AIJobSummaryViewModel()

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Load Sample Data
                HStack {
                    Spacer()
                    Button {
                        viewModel.loadSampleData()
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "beaker.fill")
                            Text("Load Sample Data")
                        }
                        .font(.caption)
                        .foregroundColor(.primaryOrange)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.primaryOrange.opacity(0.1))
                        .clipShape(Capsule())
                    }
                }
                .padding(.horizontal)

                AIFeatureHeader(
                    icon: "clipboard.fill",
                    title: "Job Summary Generator",
                    description: "Generate professional job reports from technician notes"
                )

                // Technician Notes
                VStack(alignment: .leading, spacing: 8) {
                    Text("Technician Notes")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.textPrimary)

                    TextEditor(text: $viewModel.technicianNotes)
                        .frame(height: 120)
                        .padding(8)
                        .background(Color.backgroundSecondary)
                        .cornerRadius(8)
                }
                .padding(.horizontal)

                // Work Performed
                VStack(alignment: .leading, spacing: 8) {
                    Text("Work Performed")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.textPrimary)

                    TextEditor(text: $viewModel.workPerformed)
                        .frame(height: 80)
                        .padding(8)
                        .background(Color.backgroundSecondary)
                        .cornerRadius(8)
                }
                .padding(.horizontal)

                // Time Spent
                VStack(alignment: .leading, spacing: 8) {
                    Text("Time Spent (hours)")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.textPrimary)

                    TextField("e.g., 2.5", text: $viewModel.timeSpent)
                        .textFieldStyle(.roundedBorder)
                        .keyboardType(.decimalPad)
                }
                .padding(.horizontal)

                // Parts Used
                VStack(alignment: .leading, spacing: 8) {
                    Text("Parts Used")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.textPrimary)

                    TextEditor(text: $viewModel.partsUsed)
                        .frame(height: 60)
                        .padding(8)
                        .background(Color.backgroundSecondary)
                        .cornerRadius(8)
                }
                .padding(.horizontal)

                Button {
                    Task { await viewModel.generateSummary() }
                } label: {
                    AIActionButton(text: "Generate Job Summary", isLoading: viewModel.isLoading)
                }
                .disabled(viewModel.technicianNotes.isEmpty)
                .padding(.horizontal)

                if let result = viewModel.result {
                    AIResultCard(title: "Job Summary", content: result)
                        .padding(.horizontal)
                }
            }
            .padding(.vertical)
        }
    }
}

// MARK: - AI Inventory Forecast View

struct AIInventoryForecastView: View {
    @StateObject private var viewModel = AIInventoryForecastViewModel()

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Load Sample Data
                HStack {
                    Spacer()
                    Button {
                        viewModel.loadSampleData()
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "beaker.fill")
                            Text("Load Sample Data")
                        }
                        .font(.caption)
                        .foregroundColor(.primaryOrange)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.primaryOrange.opacity(0.1))
                        .clipShape(Capsule())
                    }
                }
                .padding(.horizontal)

                AIFeatureHeader(
                    icon: "shippingbox.fill",
                    title: "Inventory Forecast",
                    description: "Predict inventory needs and optimize reorder timing"
                )

                // Trade/Category
                VStack(alignment: .leading, spacing: 8) {
                    Text("Trade Category")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.textPrimary)

                    Picker("Trade", selection: $viewModel.tradeCategory) {
                        Text("HVAC").tag("HVAC")
                        Text("Plumbing").tag("Plumbing")
                        Text("Electrical").tag("Electrical")
                        Text("All Trades").tag("All")
                    }
                    .pickerStyle(.menu)
                    .padding()
                    .background(Color.backgroundSecondary)
                    .cornerRadius(8)
                }
                .padding(.horizontal)

                // Forecast Period
                VStack(alignment: .leading, spacing: 8) {
                    Text("Forecast Period")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.textPrimary)

                    Picker("Period", selection: $viewModel.forecastPeriod) {
                        Text("Next 30 Days").tag("30")
                        Text("Next 60 Days").tag("60")
                        Text("Next 90 Days").tag("90")
                    }
                    .pickerStyle(.segmented)
                }
                .padding(.horizontal)

                // Current Stock Notes
                VStack(alignment: .leading, spacing: 8) {
                    Text("Current Stock Notes (Optional)")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.textPrimary)

                    TextEditor(text: $viewModel.stockNotes)
                        .frame(height: 80)
                        .padding(8)
                        .background(Color.backgroundSecondary)
                        .cornerRadius(8)
                }
                .padding(.horizontal)

                Button {
                    Task { await viewModel.forecast() }
                } label: {
                    AIActionButton(text: "Generate Forecast", isLoading: viewModel.isLoading)
                }
                .padding(.horizontal)

                if let result = viewModel.result {
                    AIResultCard(title: "Inventory Forecast", content: result)
                        .padding(.horizontal)
                }
            }
            .padding(.vertical)
        }
    }
}

// MARK: - Generic Feature View

struct AIGenericFeatureView: View {
    let feature: AIFeature

    var body: some View {
        VStack(spacing: 24) {
            Image(systemName: feature.icon)
                .font(.system(size: 60))
                .foregroundColor(feature.color)

            Text(feature.name)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.textPrimary)

            Text(feature.description)
                .font(.body)
                .foregroundColor(.textSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            Text("Coming Soon")
                .font(.headline)
                .foregroundColor(.white)
                .padding(.horizontal, 24)
                .padding(.vertical, 12)
                .background(Color.primaryOrange)
                .cornerRadius(12)
        }
        .padding()
    }
}

// MARK: - Shared Components

struct AIFeatureHeader: View {
    let icon: String
    let title: String
    let description: String

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 40))
                .foregroundColor(.primaryOrange)

            Text(title)
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(.textPrimary)

            Text(description)
                .font(.subheadline)
                .foregroundColor(.textSecondary)
                .multilineTextAlignment(.center)
        }
        .padding()
    }
}

struct AIActionButton: View {
    let text: String
    let isLoading: Bool

    var body: some View {
        HStack {
            if isLoading {
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                Text("Processing...")
            } else {
                Image(systemName: "sparkles")
                Text(text)
            }
        }
        .primaryButtonStyle()
    }
}

struct AIResultCard: View {
    let title: String
    let content: String

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "sparkles")
                    .foregroundColor(.primaryOrange)
                Text(title)
                    .font(.headline)
                    .foregroundColor(.textPrimary)
            }

            Text(content)
                .font(.subheadline)
                .foregroundColor(.textSecondary)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.primaryOrange.opacity(0.1))
        .cornerRadius(12)
    }
}

struct AIStatCard: View {
    let value: String
    let label: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title)
                .fontWeight(.bold)
                .foregroundColor(color)
            Text(label)
                .font(.caption)
                .foregroundColor(.textSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color.backgroundSecondary)
        .cornerRadius(12)
    }
}

struct FilterChipView: View {
    let label: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.subheadline)
                .fontWeight(isSelected ? .semibold : .regular)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(isSelected ? Color.primaryOrange : Color.backgroundSecondary)
                .foregroundColor(isSelected ? .white : .textPrimary)
                .cornerRadius(20)
        }
    }
}

struct DiagnosticSection: View {
    let title: String
    let items: [String]
    let icon: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.textPrimary)
            }

            VStack(alignment: .leading, spacing: 4) {
                ForEach(items, id: \.self) { item in
                    HStack(alignment: .top, spacing: 8) {
                        Text("•")
                            .foregroundColor(color)
                        Text(item)
                            .font(.caption)
                            .foregroundColor(.textSecondary)
                    }
                }
            }
        }
        .padding()
        .background(Color.backgroundSecondary)
        .cornerRadius(12)
    }
}

// MARK: - View Models

@MainActor
class AIDispatchOptimizerViewModel: ObservableObject {
    @Published var selectedDate = Date()
    @Published var availableTechs = 0
    @Published var unassignedJobs = 0
    @Published var result: String?
    @Published var isLoading = false

    func loadSampleData() {
        availableTechs = 3
        unassignedJobs = 4
    }

    func optimize() async {
        isLoading = true
        do {
            result = try await APIService.shared.aiDispatchOptimizer(date: selectedDate)
        } catch {
            result = "Error: \(error.localizedDescription)"
        }
        isLoading = false
    }
}

@MainActor
class AIDiagnosticsViewModel: ObservableObject {
    @Published var selectedTrade = "HVAC"
    @Published var symptoms = ""
    @Published var result: DiagnosticResult?
    @Published var isLoading = false
    @Published var error: String?

    func diagnose() async {
        isLoading = true
        error = nil
        do {
            result = try await APIService.shared.getDiagnostics(
                tradeType: selectedTrade,
                symptoms: [symptoms],
                equipmentType: selectedTrade,
                additionalInfo: nil
            )
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }
}

@MainActor
class AISmartSchedulingViewModel: ObservableObject {
    @Published var customerName = ""
    @Published var serviceType = "AC Repair"
    @Published var preferredDate = Date()
    @Published var preferredTime = "Morning"
    @Published var result: String?
    @Published var isLoading = false

    func loadSampleData() {
        customerName = "Johnson Residence"
        serviceType = "AC Repair"
        preferredTime = "Morning"
    }

    func findSlots() async {
        isLoading = true
        do {
            result = try await APIService.shared.aiSmartScheduling(
                customerName: customerName,
                serviceType: serviceType,
                preferredDate: preferredDate,
                preferredTime: preferredTime
            )
        } catch {
            result = "Error: \(error.localizedDescription)"
        }
        isLoading = false
    }
}

@MainActor
class AIPredictiveMaintenanceViewModel: ObservableObject {
    @Published var equipmentType = "Central AC Unit"
    @Published var equipmentAge = ""
    @Published var lastServiceDate = Date()
    @Published var serviceHistory = ""
    @Published var result: String?
    @Published var isLoading = false

    func loadSampleData() {
        equipmentType = "Central AC Unit"
        equipmentAge = "8"
        serviceHistory = "Annual maintenance done each year. Capacitor replaced 2 years ago. Refrigerant topped off last summer."
    }

    func predict() async {
        isLoading = true
        do {
            result = try await APIService.shared.aiPredictiveMaintenance(
                equipmentType: equipmentType,
                equipmentAge: Int(equipmentAge) ?? 0,
                lastServiceDate: lastServiceDate,
                serviceHistory: serviceHistory
            )
        } catch {
            result = "Error: \(error.localizedDescription)"
        }
        isLoading = false
    }
}

@MainActor
class AICustomerInsightsViewModel: ObservableObject {
    @Published var customers: [Customer] = []
    @Published var selectedCustomerId = ""
    @Published var result: String?
    @Published var isLoading = false
    @Published var isLoadingCustomers = false

    var selectedCustomer: Customer? {
        customers.first { $0.id == selectedCustomerId }
    }

    func loadCustomers() async {
        isLoadingCustomers = true
        do {
            customers = try await CustomerService.shared.getCustomers()
        } catch {
            print("Failed to load customers: \(error)")
        }
        isLoadingCustomers = false
    }

    func analyze() async {
        guard let customer = selectedCustomer else { return }
        isLoading = true
        do {
            let customerName = "\(customer.firstName ?? "") \(customer.lastName ?? "")".trimmingCharacters(in: .whitespaces)
            result = try await APIService.shared.aiCustomerInsights(customerName: customerName.isEmpty ? "Unknown Customer" : customerName)
        } catch {
            result = "Error: \(error.localizedDescription)"
        }
        isLoading = false
    }
}

@MainActor
class AIQuoteGeneratorViewModel: ObservableObject {
    @Published var jobDescription = ""
    @Published var tradeType = "HVAC"
    @Published var result: String?
    @Published var isLoading = false

    func generateQuote() async {
        isLoading = true
        do {
            result = try await APIService.shared.aiQuoteGenerator(service: jobDescription, tradeType: tradeType, customerName: nil)
        } catch {
            result = "Error: \(error.localizedDescription)"
        }
        isLoading = false
    }
}

@MainActor
class AIJobSummaryViewModel: ObservableObject {
    @Published var technicianNotes = ""
    @Published var workPerformed = ""
    @Published var timeSpent = ""
    @Published var partsUsed = ""
    @Published var result: String?
    @Published var isLoading = false

    func loadSampleData() {
        technicianNotes = """
Found capacitor completely failed. Unit was not starting at all.
Checked refrigerant levels - low by 2 lbs, likely slow leak at service valve.
Cleaned condenser coil - heavily soiled with debris.
Noticed some corrosion on copper lines near outdoor unit.
Customer mentioned unit has been struggling for past 2 weeks.
"""
        workPerformed = """
Replaced dual run capacitor (45/5 MFD).
Added 2 lbs R-410A refrigerant.
Cleaned condenser and evaporator coils.
Tightened service valve and applied leak stop.
"""
        timeSpent = "2.5"
        partsUsed = "Dual Run Capacitor 45/5 MFD - $45, R-410A Refrigerant 2 lbs - $80, Coil Cleaner - $15"
    }

    func generateSummary() async {
        isLoading = true
        do {
            result = try await APIService.shared.aiJobSummary(
                technicianNotes: technicianNotes,
                workPerformed: workPerformed,
                timeSpent: Double(timeSpent) ?? 0,
                partsUsed: partsUsed
            )
        } catch {
            result = "Error: \(error.localizedDescription)"
        }
        isLoading = false
    }
}

@MainActor
class AIInventoryForecastViewModel: ObservableObject {
    @Published var tradeCategory = "HVAC"
    @Published var forecastPeriod = "30"
    @Published var stockNotes = ""
    @Published var result: String?
    @Published var isLoading = false

    func loadSampleData() {
        tradeCategory = "HVAC"
        forecastPeriod = "30"
        stockNotes = "Low on capacitors and contactors. Refrigerant stock adequate. Filter inventory needs review."
    }

    func forecast() async {
        isLoading = true
        do {
            result = try await APIService.shared.aiInventoryForecast(
                tradeCategory: tradeCategory,
                forecastPeriod: Int(forecastPeriod) ?? 30,
                stockNotes: stockNotes
            )
        } catch {
            result = "Error: \(error.localizedDescription)"
        }
        isLoading = false
    }
}

#Preview {
    AIFeaturesView()
}
