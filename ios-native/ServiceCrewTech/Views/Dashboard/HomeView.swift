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

                    // Active Job Card
                    if let activeJob = viewModel.activeJob {
                        activeJobCard(job: activeJob)
                    }

                    // Upcoming Jobs
                    upcomingJobsSection

                    // Completed Jobs
                    if !viewModel.completedJobs.isEmpty {
                        completedJobsSection
                    }
                }
                .padding()
            }
            .background(Color.backgroundPrimary)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: viewModel.refreshJobs) {
                        Image(systemName: "arrow.clockwise")
                            .foregroundColor(.primaryOrange)
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

            VStack(alignment: .trailing) {
                Text("\(viewModel.todayJobs.count)")
                    .font(.title)
                    .fontWeight(.bold)
                    .foregroundColor(.primaryOrange)

                Text("Jobs Today")
                    .font(.caption)
                    .foregroundColor(.textSecondary)
            }
        }
    }

    // MARK: - Active Job Card

    private func activeJobCard(job: Job) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "play.circle.fill")
                    .foregroundColor(.primaryOrange)

                Text("Current Job")
                    .font(.headline)
                    .foregroundColor(.primaryOrange)
            }

            NavigationLink(destination: JobDetailView(jobId: job.id)) {
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(job.jobNumber)
                                .font(.headline)
                                .foregroundColor(.textPrimary)

                            Text(job.title)
                                .font(.subheadline)
                                .foregroundColor(.textSecondary)
                                .lineLimit(1)
                        }

                        Spacer()

                        Text(job.priority.displayName)
                            .badge(color: job.priority.swiftUIColor)
                    }

                    HStack(spacing: 8) {
                        Image(systemName: "mappin.circle.fill")
                            .foregroundColor(.textTertiary)

                        Text(job.shortAddress)
                            .font(.subheadline)
                            .foregroundColor(.textSecondary)
                            .lineLimit(1)
                    }

                    Text(job.customerName)
                        .font(.subheadline)
                        .foregroundColor(.textSecondary)
                }
                .padding()
                .background(Color.white)
                .cornerRadius(12)
            }
        }
        .padding()
        .background(Color.primaryOrange.opacity(0.1))
        .cornerRadius(16)
    }

    // MARK: - Upcoming Jobs Section

    private var upcomingJobsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "clock.fill")
                    .foregroundColor(.textSecondary)

                Text("Upcoming (\(viewModel.upcomingJobs.count))")
                    .font(.headline)
                    .foregroundColor(.textPrimary)
            }

            if viewModel.isLoading && viewModel.upcomingJobs.isEmpty {
                loadingPlaceholder
            } else if viewModel.upcomingJobs.isEmpty {
                emptyState(message: "No upcoming jobs")
            } else {
                ForEach(viewModel.upcomingJobs) { job in
                    NavigationLink(destination: JobDetailView(jobId: job.id)) {
                        JobCardView(job: job)
                    }
                }
            }
        }
    }

    // MARK: - Completed Jobs Section

    private var completedJobsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.secondaryGreen)

                Text("Completed (\(viewModel.completedJobs.count))")
                    .font(.headline)
                    .foregroundColor(.textPrimary)
            }

            ForEach(viewModel.completedJobs) { job in
                NavigationLink(destination: JobDetailView(jobId: job.id)) {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(job.jobNumber)
                                .font(.subheadline)
                                .fontWeight(.medium)
                                .foregroundColor(.textPrimary)

                            Text(job.title)
                                .font(.caption)
                                .foregroundColor(.textSecondary)
                                .lineLimit(1)
                        }

                        Spacer()

                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.secondaryGreen)
                    }
                    .padding()
                    .background(Color.secondaryGreen.opacity(0.1))
                    .cornerRadius(12)
                }
            }
        }
    }

    // MARK: - Helper Views

    private var loadingPlaceholder: some View {
        VStack(spacing: 12) {
            ForEach(0..<3) { _ in
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.backgroundSecondary)
                    .frame(height: 100)
            }
        }
        .redacted(reason: .placeholder)
    }

    private func emptyState(message: String) -> some View {
        VStack(spacing: 12) {
            Image(systemName: "calendar.badge.exclamationmark")
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

// MARK: - Home View Model

@MainActor
class HomeViewModel: ObservableObject {
    @Published var todayJobs: [Job] = []
    @Published var isLoading = false
    @Published var error: String?

    var activeJob: Job? {
        todayJobs.first { $0.status == .inProgress }
    }

    var upcomingJobs: [Job] {
        todayJobs.filter { ![.completed, .cancelled, .inProgress].contains($0.status) }
    }

    var completedJobs: [Job] {
        todayJobs.filter { $0.status == .completed }
    }

    func loadJobs() async {
        isLoading = true
        error = nil

        do {
            todayJobs = try await APIService.shared.getMyJobs()
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
    HomeView()
        .environmentObject(AuthManager.shared)
}
