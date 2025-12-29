import SwiftUI

struct ScheduleView: View {
    @State private var selectedDate = Date()
    @StateObject private var viewModel = ScheduleViewModel()

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Date picker
                DatePicker(
                    "Select Date",
                    selection: $selectedDate,
                    displayedComponents: [.date]
                )
                .datePickerStyle(.graphical)
                .tint(Color.primaryOrange)
                .padding()
                .background(Color.white)

                // Jobs list for selected date
                ScrollView {
                    VStack(spacing: 16) {
                        if viewModel.isLoading {
                            loadingView
                        } else if jobsForSelectedDate.isEmpty {
                            emptyStateView
                        } else {
                            ForEach(jobsForSelectedDate) { job in
                                NavigationLink(destination: JobDetailView(jobId: job.id)) {
                                    ScheduleJobCard(job: job)
                                }
                            }
                        }
                    }
                    .padding()
                }
                .background(Color.backgroundPrimary)
            }
            .navigationTitle("Schedule")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    NavigationLink(destination: NewJobView(onSave: {
                        Task { await viewModel.loadJobs() }
                    })) {
                        Image(systemName: "plus")
                    }
                }
            }
            .task {
                await viewModel.loadJobs()
            }
            .refreshable {
                await viewModel.loadJobs()
            }
        }
    }

    private var jobsForSelectedDate: [Job] {
        viewModel.jobs.filter { job in
            guard let scheduledStart = job.scheduledStart else { return false }
            return Calendar.current.isDate(scheduledStart, inSameDayAs: selectedDate)
        }
    }

    private var loadingView: some View {
        VStack {
            ProgressView()
            Text("Loading schedule...")
                .font(.subheadline)
                .foregroundColor(.textSecondary)
                .padding(.top)
        }
        .frame(maxWidth: .infinity)
        .padding(48)
    }

    private var emptyStateView: some View {
        VStack(spacing: 16) {
            Image(systemName: "calendar.badge.exclamationmark")
                .font(.system(size: 48))
                .foregroundColor(.textTertiary)

            Text("No jobs scheduled")
                .font(.headline)
                .foregroundColor(.textPrimary)

            Text("You have no jobs scheduled for this date.")
                .font(.subheadline)
                .foregroundColor(.textSecondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(48)
    }
}

struct ScheduleJobCard: View {
    let job: Job

    var body: some View {
        HStack(spacing: 16) {
            // Time
            VStack(alignment: .center, spacing: 4) {
                if let timeStart = job.timeWindowStart {
                    Text(timeStart)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.primaryOrange)
                }

                if let duration = job.estimatedDuration {
                    Text("\(duration) min")
                        .font(.caption)
                        .foregroundColor(.textTertiary)
                }
            }
            .frame(width: 70)

            // Divider
            Rectangle()
                .fill(Color.borderColor)
                .frame(width: 2)

            // Job info
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(job.jobNumber)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.textPrimary)

                    Spacer()

                    Text(job.status.displayName)
                        .badge(color: job.status.swiftUIColor)
                }

                Text(job.displayTitle)
                    .font(.caption)
                    .foregroundColor(.textSecondary)
                    .lineLimit(1)

                HStack(spacing: 4) {
                    Image(systemName: "mappin")
                        .font(.caption2)
                    Text(job.shortAddress)
                        .font(.caption)
                }
                .foregroundColor(.textTertiary)

                Text(job.customerName)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.textSecondary)
            }
        }
        .padding()
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
}

@MainActor
class ScheduleViewModel: ObservableObject {
    @Published var jobs: [Job] = []
    @Published var isLoading = false

    func loadJobs() async {
        isLoading = true
        do {
            jobs = try await APIService.shared.getMyJobs(all: true)
        } catch {
            print("Failed to load schedule: \(error)")
        }
        isLoading = false
    }
}

#Preview {
    ScheduleView()
}
