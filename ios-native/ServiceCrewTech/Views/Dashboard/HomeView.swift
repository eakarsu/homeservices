import SwiftUI

struct HomeView: View {
    @EnvironmentObject var authManager: AuthManager
    @StateObject private var viewModel = HomeViewModel()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Header
                    headerSection

                    // Error display
                    if let error = viewModel.error {
                        Text(error)
                            .foregroundColor(.red)
                            .padding()
                            .background(Color.red.opacity(0.1))
                            .cornerRadius(8)
                    }

                    // Stats Grid
                    statsGrid

                    // Revenue Section
                    revenueSection

                    // Recent Jobs
                    recentJobsSection

                    // Alerts Section
                    alertsSection
                }
                .padding()
            }
            .background(Color.backgroundPrimary)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: viewModel.refresh) {
                        Image(systemName: "arrow.clockwise")
                            .foregroundColor(.primaryOrange)
                    }
                }
            }
            .refreshable {
                await viewModel.loadData()
            }
            .task {
                await viewModel.loadData()
            }
        }
    }

    // MARK: - Header Section

    private var headerSection: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Hi, \(authManager.userDisplayName.split(separator: " ").first ?? "Tech")!")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.textPrimary)

                Text(Date().formatted(date: .complete, time: .omitted))
                    .font(.subheadline)
                    .foregroundColor(.textSecondary)
            }

            Spacer()

            Text("Dashboard")
                .font(.headline)
                .foregroundColor(.textSecondary)
        }
    }

    // MARK: - Stats Grid

    private var statsGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            StatCard(
                title: "Today's Jobs",
                value: "\(viewModel.stats?.todayJobs ?? 0)",
                icon: "wrench.and.screwdriver",
                color: .secondaryBlue
            )

            StatCard(
                title: "Pending Jobs",
                value: "\(viewModel.stats?.pendingJobs ?? 0)",
                icon: "clock",
                color: .yellow
            )

            StatCard(
                title: "Completed Today",
                value: "\(viewModel.stats?.completedToday ?? 0)",
                icon: "checkmark.circle",
                color: .secondaryGreen
            )

            StatCard(
                title: "Techs Available",
                value: "\(viewModel.stats?.techniciansAvailable ?? 0)",
                icon: "person.2",
                color: .purple
            )
        }
    }

    // MARK: - Revenue Section

    private var revenueSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "chart.line.uptrend.xyaxis")
                    .foregroundColor(.secondaryGreen)

                Text("Revenue Overview")
                    .font(.headline)
                    .foregroundColor(.textPrimary)
            }

            HStack(spacing: 12) {
                RevenueCard(label: "Today", value: viewModel.revenueToday)
                RevenueCard(label: "This Week", value: viewModel.revenueWeek)
                RevenueCard(label: "This Month", value: viewModel.revenueMonth)
            }
        }
        .padding()
        .background(Color.white)
        .cornerRadius(12)
    }

    // MARK: - Recent Jobs Section

    private var recentJobsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Recent Jobs")
                    .font(.headline)
                    .foregroundColor(.textPrimary)

                Spacer()

                NavigationLink(destination: JobsListView()) {
                    Text("View All")
                        .font(.subheadline)
                        .foregroundColor(.primaryOrange)
                }
            }

            if viewModel.isLoading && viewModel.recentJobs.isEmpty {
                loadingPlaceholder
            } else if viewModel.recentJobs.isEmpty {
                emptyState(message: "No recent jobs")
            } else {
                ForEach(viewModel.recentJobs) { job in
                    NavigationLink(destination: JobDetailView(jobId: job.id)) {
                        RecentJobRow(job: job)
                    }
                }
            }
        }
        .padding()
        .background(Color.white)
        .cornerRadius(12)
    }

    // MARK: - Alerts Section

    private var alertsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Alerts & Actions")
                .font(.headline)
                .foregroundColor(.textPrimary)

            AlertRow(
                title: "Open Estimates",
                value: viewModel.stats?.openEstimates ?? 0,
                icon: "doc.text",
                color: .secondaryBlue
            )

            AlertRow(
                title: "Overdue Invoices",
                value: viewModel.stats?.overdueInvoices ?? 0,
                icon: "exclamationmark.triangle",
                color: .orange
            )

            AlertRow(
                title: "Expiring Agreements",
                value: viewModel.stats?.expiringAgreements ?? 0,
                icon: "clock",
                color: .orange
            )
        }
        .padding()
        .background(Color.white)
        .cornerRadius(12)
    }

    // MARK: - Helper Views

    private var loadingPlaceholder: some View {
        VStack(spacing: 12) {
            ForEach(0..<3, id: \.self) { _ in
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.backgroundSecondary)
                    .frame(height: 60)
            }
        }
        .redacted(reason: .placeholder)
    }

    private func emptyState(message: String) -> some View {
        VStack(spacing: 12) {
            Image(systemName: "tray")
                .font(.system(size: 40))
                .foregroundColor(.textTertiary)

            Text(message)
                .font(.subheadline)
                .foregroundColor(.textSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(32)
    }
}

// MARK: - Stat Card

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.caption)
                    .foregroundColor(.textSecondary)

                Text(value)
                    .font(.title)
                    .fontWeight(.bold)
                    .foregroundColor(.textPrimary)
            }

            Spacer()

            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(.white)
                .padding(10)
                .background(color)
                .cornerRadius(8)
        }
        .padding()
        .background(Color.white)
        .cornerRadius(12)
    }
}

// MARK: - Revenue Card

struct RevenueCard: View {
    let label: String
    let value: Double

    var body: some View {
        VStack(spacing: 4) {
            Text(label)
                .font(.caption)
                .foregroundColor(.textSecondary)

            Text(formatCurrency(value))
                .font(.headline)
                .fontWeight(.bold)
                .foregroundColor(.textPrimary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(Color.backgroundSecondary)
        .cornerRadius(8)
    }

    private func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: amount)) ?? "$\(amount)"
    }
}

// MARK: - Recent Job Row

struct RecentJobRow: View {
    let job: Job

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(job.jobNumber)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.textPrimary)

                Text(job.displayTitle)
                    .font(.caption)
                    .foregroundColor(.textSecondary)
                    .lineLimit(1)

                Text(job.customerName)
                    .font(.caption2)
                    .foregroundColor(.textTertiary)
            }

            Spacer()

            Text(job.status.displayName)
                .font(.caption)
                .fontWeight(.medium)
                .foregroundColor(job.status.swiftUIColor)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(job.status.swiftUIColor.opacity(0.15))
                .cornerRadius(4)
        }
        .padding()
        .background(Color.backgroundSecondary)
        .cornerRadius(8)
    }
}

// MARK: - Alert Row

struct AlertRow: View {
    let title: String
    let value: Int
    let icon: String
    let color: Color

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(color)

            Text(title)
                .font(.subheadline)
                .foregroundColor(.textSecondary)

            Spacer()

            Text("\(value)")
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(.textPrimary)
        }
        .padding()
        .background(Color.backgroundSecondary)
        .cornerRadius(8)
    }
}

// MARK: - Home View Model

@MainActor
class HomeViewModel: ObservableObject {
    @Published var stats: DashboardStats?
    @Published var recentJobs: [Job] = []
    @Published var isLoading = false
    @Published var error: String?

    var revenueToday: Double { stats?.revenue?.today ?? 0 }
    var revenueWeek: Double { stats?.revenue?.week ?? 0 }
    var revenueMonth: Double { stats?.revenue?.month ?? 0 }

    func loadData() async {
        isLoading = true
        error = nil

        // Load stats and recent jobs in parallel
        async let statsTask = loadStats()
        async let jobsTask = loadRecentJobs()

        await statsTask
        await jobsTask

        isLoading = false
    }

    private func loadStats() async {
        do {
            let loadedStats = try await APIService.shared.getDashboardStats()
            stats = loadedStats
            print("Dashboard: Loaded stats - todayJobs: \(loadedStats.todayJobs)")
        } catch {
            print("Dashboard stats ERROR: \(error)")
            self.error = error.localizedDescription
        }
    }

    private func loadRecentJobs() async {
        do {
            let response = try await APIService.shared.getRecentJobs(limit: 5)
            recentJobs = response.data
            print("Dashboard: Loaded \(response.data.count) recent jobs")
        } catch {
            print("Dashboard jobs ERROR: \(error)")
            // Don't override stats error
            if self.error == nil {
                self.error = error.localizedDescription
            }
        }
    }

    func refresh() {
        Task {
            await loadData()
        }
    }
}

#Preview {
    HomeView()
        .environmentObject(AuthManager.shared)
}
