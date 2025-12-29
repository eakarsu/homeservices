import SwiftUI

// MARK: - Reports View

struct ReportsView: View {
    @State private var reportsData: ReportsData?
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var selectedRange = "month"

    private let ranges = ["week", "month", "quarter", "year"]

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    ProgressView("Loading reports...")
                } else if let error = errorMessage {
                    VStack(spacing: 16) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.largeTitle)
                            .foregroundColor(.orange)
                        Text(error)
                            .multilineTextAlignment(.center)
                        Button("Retry") {
                            Task { await loadReports() }
                        }
                        .buttonStyle(.bordered)
                    }
                    .padding()
                } else if let data = reportsData {
                    ScrollView {
                        VStack(spacing: 20) {
                            // Range Picker
                            Picker("Time Range", selection: $selectedRange) {
                                ForEach(ranges, id: \.self) { range in
                                    Text(range.capitalized).tag(range)
                                }
                            }
                            .pickerStyle(.segmented)
                            .padding(.horizontal)

                            // Revenue Cards
                            revenueSection(data: data)

                            // Jobs Section
                            jobsSection(data: data)

                            // Technicians Section
                            techniciansSection(data: data)

                            // Customers Section
                            customersSection(data: data)
                        }
                        .padding()
                    }
                } else {
                    VStack(spacing: 16) {
                        Image(systemName: "chart.bar")
                            .font(.system(size: 50))
                            .foregroundColor(.secondary)
                        Text("No Data")
                            .font(.title2)
                            .fontWeight(.semibold)
                        Text("No report data available")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .padding()
                }
            }
            .navigationTitle("Reports")
            .refreshable {
                await loadReports()
            }
            .onChange(of: selectedRange) { _ in
                Task { await loadReports() }
            }
        }
        .task {
            await loadReports()
        }
    }

    // MARK: - Revenue Section

    private func revenueSection(data: ReportsData) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Revenue")
                .font(.headline)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                ReportCard(
                    title: "Today",
                    value: formatCurrency(data.revenue.today),
                    icon: "dollarsign.circle",
                    color: .green
                )

                ReportCard(
                    title: "This Week",
                    value: formatCurrency(data.revenue.week),
                    icon: "calendar",
                    color: .blue
                )

                ReportCard(
                    title: "This Month",
                    value: formatCurrency(data.revenue.month),
                    icon: "calendar.badge.clock",
                    color: .purple
                )

                ReportCard(
                    title: "This Year",
                    value: formatCurrency(data.revenue.year),
                    icon: "chart.line.uptrend.xyaxis",
                    color: .orange
                )
            }

            // Month over Month Change
            HStack {
                Image(systemName: data.revenue.monthOverMonth >= 0 ? "arrow.up.right" : "arrow.down.right")
                    .foregroundColor(data.revenue.monthOverMonth >= 0 ? .green : .red)
                Text("\(abs(Int(data.revenue.monthOverMonth)))% vs last month")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(.top, 4)
        }
    }

    // MARK: - Jobs Section

    private func jobsSection(data: ReportsData) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Jobs")
                .font(.headline)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                ReportCard(
                    title: "Completed",
                    value: "\(data.jobs.completed)",
                    icon: "checkmark.circle",
                    color: .green
                )

                ReportCard(
                    title: "Scheduled",
                    value: "\(data.jobs.scheduled)",
                    icon: "clock",
                    color: .orange
                )

                ReportCard(
                    title: "Avg Duration",
                    value: formatDuration(data.jobs.avgDuration),
                    icon: "timer",
                    color: .blue
                )

                ReportCard(
                    title: "Avg Revenue",
                    value: formatCurrency(data.jobs.avgRevenue),
                    icon: "dollarsign.square",
                    color: .purple
                )
            }
        }
    }

    // MARK: - Technicians Section

    private func techniciansSection(data: ReportsData) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Technicians")
                .font(.headline)

            VStack(spacing: 8) {
                HStack {
                    Text("Top Performer")
                        .foregroundColor(.secondary)
                    Spacer()
                    Text(data.technicians.topPerformer)
                        .fontWeight(.medium)
                }

                Divider()

                HStack {
                    Text("Avg Jobs/Day")
                        .foregroundColor(.secondary)
                    Spacer()
                    Text(String(format: "%.1f", data.technicians.avgJobsPerDay))
                        .fontWeight(.medium)
                }

                Divider()

                HStack {
                    Text("Utilization Rate")
                        .foregroundColor(.secondary)
                    Spacer()
                    Text("\(Int(data.technicians.utilizationRate))%")
                        .fontWeight(.medium)
                }
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
        }
    }

    // MARK: - Customers Section

    private func customersSection(data: ReportsData) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Customers")
                .font(.headline)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                VStack(spacing: 4) {
                    Text("\(data.customers.new)")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.green)
                    Text("New")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding()
                .frame(maxWidth: .infinity)
                .background(Color(.systemGray6))
                .cornerRadius(12)

                VStack(spacing: 4) {
                    Text("\(data.customers.total)")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.blue)
                    Text("Total")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding()
                .frame(maxWidth: .infinity)
                .background(Color(.systemGray6))
                .cornerRadius(12)

                VStack(spacing: 4) {
                    Text("\(Int(data.customers.repeatRate))%")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.purple)
                    Text("Repeat")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding()
                .frame(maxWidth: .infinity)
                .background(Color(.systemGray6))
                .cornerRadius(12)
            }
        }
    }

    // MARK: - Helpers

    private func formatCurrency(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.maximumFractionDigits = 0
        return formatter.string(from: NSNumber(value: value)) ?? "$0"
    }

    private func formatDuration(_ minutes: Double) -> String {
        let hours = Int(minutes) / 60
        let mins = Int(minutes) % 60
        if hours > 0 {
            return "\(hours)h \(mins)m"
        }
        return "\(mins)m"
    }

    // MARK: - Load Reports

    private func loadReports() async {
        isLoading = true
        errorMessage = nil

        do {
            reportsData = try await ReportsService.shared.getReports(range: selectedRange)
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }
}

// MARK: - Report Card

struct ReportCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                Spacer()
            }

            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .lineLimit(1)
                .minimumScaleFactor(0.7)

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

#Preview {
    ReportsView()
}
