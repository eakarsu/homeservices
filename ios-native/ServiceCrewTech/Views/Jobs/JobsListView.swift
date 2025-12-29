import SwiftUI

struct JobsListView: View {
    @StateObject private var viewModel = JobsListViewModel()
    @State private var searchText = ""
    @State private var selectedFilter: JobFilter = .all

    enum JobFilter: String, CaseIterable {
        case all = "All"
        case scheduled = "Scheduled"
        case active = "Active"
        case completed = "Completed"
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Search bar
                searchBar

                // Filter tabs
                filterTabs

                // Jobs list
                if viewModel.isLoading && viewModel.jobs.isEmpty {
                    loadingView
                } else if filteredJobs.isEmpty {
                    emptyStateView
                } else {
                    jobsList
                }
            }
            .background(Color.backgroundPrimary)
            .navigationTitle("My Jobs")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    HStack {
                        NavigationLink(destination: NewJobView(onSave: {
                            Task { await viewModel.loadJobs() }
                        })) {
                            Image(systemName: "plus")
                        }
                        Button(action: viewModel.refreshJobs) {
                            Image(systemName: "arrow.clockwise")
                        }
                    }
                }
            }
            .refreshable {
                await viewModel.loadJobs()
            }
            .task {
                await viewModel.loadJobs()
            }
        }
    }

    // MARK: - Search Bar

    private var searchBar: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.textTertiary)

            TextField("Search jobs, customers, addresses...", text: $searchText)
                .textFieldStyle(.plain)

            if !searchText.isEmpty {
                Button(action: { searchText = "" }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.textTertiary)
                }
            }
        }
        .padding()
        .background(Color.backgroundSecondary)
        .cornerRadius(12)
        .padding(.horizontal)
        .padding(.top, 8)
    }

    // MARK: - Filter Tabs

    private var filterTabs: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(JobFilter.allCases, id: \.self) { filter in
                    FilterTab(
                        title: filter.rawValue,
                        count: countForFilter(filter),
                        isSelected: selectedFilter == filter,
                        color: colorForFilter(filter)
                    ) {
                        withAnimation {
                            selectedFilter = filter
                        }
                    }
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 12)
        }
    }

    // MARK: - Jobs List

    private var jobsList: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(filteredJobs) { job in
                    NavigationLink(destination: JobDetailView(jobId: job.id)) {
                        JobCardView(job: job, showStatus: true)
                    }
                }
            }
            .padding()
        }
    }

    // MARK: - Loading View

    private var loadingView: some View {
        VStack {
            Spacer()
            ProgressView()
                .scaleEffect(1.5)
            Text("Loading jobs...")
                .font(.subheadline)
                .foregroundColor(.textSecondary)
                .padding(.top)
            Spacer()
        }
    }

    // MARK: - Empty State

    private var emptyStateView: some View {
        VStack(spacing: 16) {
            Spacer()

            Image(systemName: "doc.text.magnifyingglass")
                .font(.system(size: 60))
                .foregroundColor(.textTertiary)

            Text("No Jobs Found")
                .font(.headline)
                .foregroundColor(.textPrimary)

            Text(searchText.isEmpty ? "No jobs match this filter" : "Try a different search term")
                .font(.subheadline)
                .foregroundColor(.textSecondary)

            Spacer()
        }
    }

    // MARK: - Helpers

    private var filteredJobs: [Job] {
        var jobs = viewModel.jobs

        // Apply filter
        switch selectedFilter {
        case .all:
            break
        case .scheduled:
            jobs = jobs.filter { [.scheduled, .dispatched].contains($0.status) }
        case .active:
            jobs = jobs.filter { $0.status == .inProgress }
        case .completed:
            jobs = jobs.filter { $0.status == .completed }
        }

        // Apply search
        if !searchText.isEmpty {
            let query = searchText.lowercased()
            jobs = jobs.filter { job in
                job.jobNumber.lowercased().contains(query) ||
                job.displayTitle.lowercased().contains(query) ||
                job.customerName.lowercased().contains(query) ||
                job.fullAddress.lowercased().contains(query)
            }
        }

        return jobs
    }

    private func countForFilter(_ filter: JobFilter) -> Int {
        switch filter {
        case .all:
            return viewModel.jobs.count
        case .scheduled:
            return viewModel.jobs.filter { [.scheduled, .dispatched].contains($0.status) }.count
        case .active:
            return viewModel.jobs.filter { $0.status == .inProgress }.count
        case .completed:
            return viewModel.jobs.filter { $0.status == .completed }.count
        }
    }

    private func colorForFilter(_ filter: JobFilter) -> Color {
        switch filter {
        case .all:
            return .primaryOrange
        case .scheduled:
            return .textSecondary
        case .active:
            return .secondaryBlue
        case .completed:
            return .secondaryGreen
        }
    }
}

// MARK: - Filter Tab

struct FilterTab: View {
    let title: String
    let count: Int
    let isSelected: Bool
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text("\(title) (\(count))")
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(isSelected ? .white : color)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(isSelected ? color : color.opacity(0.15))
                .cornerRadius(20)
        }
    }
}

// MARK: - Jobs List View Model

@MainActor
class JobsListViewModel: ObservableObject {
    @Published var jobs: [Job] = []
    @Published var isLoading = false
    @Published var error: String?

    func loadJobs() async {
        isLoading = true
        error = nil

        do {
            let loadedJobs = try await APIService.shared.getMyJobs(all: true)
            jobs = loadedJobs
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func refreshJobs() {
        Task {
            await loadJobs()
        }
    }
}

// MARK: - New Job View

struct NewJobView: View {
    @Environment(\.dismiss) var dismiss
    var onSave: (() -> Void)?

    // Customer & Property
    @State private var customers: [Customer] = []
    @State private var selectedCustomerId: String = ""
    @State private var properties: [Property] = []
    @State private var selectedPropertyId: String = ""

    // Job Details
    @State private var title = ""
    @State private var description = ""
    @State private var tradeType = "HVAC"
    @State private var jobType = "SERVICE_CALL"
    @State private var priority = "NORMAL"
    @State private var serviceTypeId: String?

    // Schedule
    @State private var scheduledDate = Date()
    @State private var timeWindowStart = ""
    @State private var timeWindowEnd = ""
    @State private var estimatedDuration = ""

    @State private var isLoadingCustomers = true
    @State private var isLoadingProperties = false
    @State private var isSaving = false
    @State private var errorMessage: String?

    let tradeTypes = ["HVAC", "PLUMBING", "ELECTRICAL"]
    let jobTypes = ["SERVICE_CALL", "MAINTENANCE", "INSTALLATION", "REPAIR", "INSPECTION", "WARRANTY", "CALLBACK"]
    let priorities = ["LOW", "NORMAL", "HIGH", "URGENT", "EMERGENCY"]

    var body: some View {
        Form {
            Section("Customer & Location") {
                if isLoadingCustomers {
                    ProgressView("Loading customers...")
                } else {
                    Picker("Customer *", selection: $selectedCustomerId) {
                        Text("Select Customer").tag("")
                        ForEach(customers) { customer in
                            Text(customer.displayName).tag(customer.id)
                        }
                    }
                    .onChange(of: selectedCustomerId) { _ in
                        loadProperties()
                    }

                    if isLoadingProperties {
                        ProgressView("Loading properties...")
                    } else if properties.isEmpty && !selectedCustomerId.isEmpty {
                        Text("No properties for this customer")
                            .foregroundColor(.textSecondary)
                    } else if !properties.isEmpty {
                        Picker("Property *", selection: $selectedPropertyId) {
                            Text("Select Property").tag("")
                            ForEach(properties) { property in
                                Text(property.fullAddress).tag(property.id)
                            }
                        }
                    }
                }
            }

            Section("Job Details") {
                TextField("Title *", text: $title)

                TextEditor(text: $description)
                    .frame(minHeight: 80)
                    .overlay(
                        Group {
                            if description.isEmpty {
                                Text("Description")
                                    .foregroundColor(.gray.opacity(0.5))
                                    .padding(.leading, 4)
                                    .padding(.top, 8)
                            }
                        },
                        alignment: .topLeading
                    )

                Picker("Trade Type *", selection: $tradeType) {
                    ForEach(tradeTypes, id: \.self) { type in
                        Text(type).tag(type)
                    }
                }

                Picker("Job Type", selection: $jobType) {
                    ForEach(jobTypes, id: \.self) { type in
                        Text(type.replacingOccurrences(of: "_", with: " ").capitalized).tag(type)
                    }
                }

                Picker("Priority", selection: $priority) {
                    ForEach(priorities, id: \.self) { p in
                        Text(p.capitalized).tag(p)
                    }
                }
            }

            Section("Schedule") {
                DatePicker("Scheduled Date", selection: $scheduledDate, displayedComponents: [.date, .hourAndMinute])

                TextField("Time Window Start (e.g., 09:00)", text: $timeWindowStart)
                TextField("Time Window End (e.g., 12:00)", text: $timeWindowEnd)
                TextField("Estimated Duration (minutes)", text: $estimatedDuration)
                    .keyboardType(.numberPad)
            }

            if let error = errorMessage {
                Section {
                    Text(error)
                        .foregroundColor(.red)
                }
            }
        }
        .navigationTitle("New Job")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button("Cancel") { dismiss() }
            }
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Save") {
                    Task { await saveJob() }
                }
                .disabled(!isFormValid || isSaving)
            }
        }
        .task {
            await loadCustomers()
        }
    }

    var isFormValid: Bool {
        !selectedCustomerId.isEmpty && !title.isEmpty && (!properties.isEmpty ? !selectedPropertyId.isEmpty : true)
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

    func loadProperties() {
        guard !selectedCustomerId.isEmpty else {
            properties = []
            selectedPropertyId = ""
            return
        }
        isLoadingProperties = true
        Task {
            do {
                properties = try await CustomerService.shared.getCustomerProperties(customerId: selectedCustomerId)
                if properties.count == 1 {
                    selectedPropertyId = properties[0].id
                }
            } catch {
                print("Failed to load properties: \(error)")
            }
            isLoadingProperties = false
        }
    }

    func saveJob() async {
        isSaving = true
        errorMessage = nil
        do {
            // Use first property if available and none selected
            let propId = selectedPropertyId.isEmpty ? properties.first?.id ?? "" : selectedPropertyId
            try await JobService.shared.createJob(
                customerId: selectedCustomerId,
                propertyId: propId,
                title: title,
                description: description.isEmpty ? nil : description,
                tradeType: tradeType,
                jobType: jobType,
                priority: priority,
                scheduledStart: scheduledDate,
                timeWindowStart: timeWindowStart.isEmpty ? nil : timeWindowStart,
                timeWindowEnd: timeWindowEnd.isEmpty ? nil : timeWindowEnd,
                estimatedDuration: Int(estimatedDuration)
            )
            onSave?()
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
        isSaving = false
    }
}

#Preview {
    JobsListView()
}
