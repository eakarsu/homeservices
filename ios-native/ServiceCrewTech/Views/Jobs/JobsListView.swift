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
                    Button(action: viewModel.refreshJobs) {
                        Image(systemName: "arrow.clockwise")
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
                job.title.lowercased().contains(query) ||
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
            jobs = try await APIService.shared.getMyJobs(all: true)
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

#Preview {
    JobsListView()
}
