import SwiftUI

// MARK: - Dispatch View

struct DispatchView: View {
    @State private var technicians: [DispatchTechnician] = []
    @State private var unassignedJobs: [UnassignedJob] = []
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var isOptimizing = false
    @State private var showOptimizeResult = false
    @State private var optimizeMessage = ""

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    ProgressView("Loading dispatch...")
                } else if let error = errorMessage {
                    VStack(spacing: 16) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.largeTitle)
                            .foregroundColor(.orange)
                        Text(error)
                            .multilineTextAlignment(.center)
                        Button("Retry") {
                            Task { await loadData() }
                        }
                        .buttonStyle(.bordered)
                    }
                    .padding()
                } else {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 20) {
                            // Unassigned Jobs Section
                            unassignedJobsSection

                            // Technicians Section
                            techniciansSection
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Dispatch")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(action: {
                        Task { await optimizeDispatch() }
                    }) {
                        if isOptimizing {
                            ProgressView()
                                .scaleEffect(0.8)
                        } else {
                            Label("AI Optimize", systemImage: "wand.and.stars")
                        }
                    }
                    .disabled(isOptimizing)
                }
            }
            .refreshable {
                await loadData()
            }
            .alert("Optimization Result", isPresented: $showOptimizeResult) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(optimizeMessage)
            }
        }
        .task {
            await loadData()
        }
    }

    // MARK: - Unassigned Jobs Section

    private var unassignedJobsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Unassigned Jobs")
                    .font(.headline)
                Spacer()
                Text("\(unassignedJobs.count)")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.orange.opacity(0.2))
                    .cornerRadius(8)
            }

            if unassignedJobs.isEmpty {
                Text("No unassigned jobs")
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
            } else {
                ForEach(unassignedJobs) { job in
                    UnassignedJobCard(job: job, technicians: technicians) { techId in
                        Task { await assignJob(jobId: job.id, technicianId: techId) }
                    }
                }
            }
        }
    }

    // MARK: - Technicians Section

    private var techniciansSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Technicians")
                .font(.headline)

            if technicians.isEmpty {
                Text("No technicians available")
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
            } else {
                ForEach(technicians) { tech in
                    DispatchTechnicianCard(technician: tech)
                }
            }
        }
    }

    // MARK: - Load Data

    private func loadData() async {
        isLoading = true
        errorMessage = nil

        do {
            async let techsTask = DispatchService.shared.getTechnicians()
            async let jobsTask = DispatchService.shared.getUnassignedJobs()

            let (techs, jobs) = try await (techsTask, jobsTask)
            technicians = techs
            unassignedJobs = jobs
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    // MARK: - Assign Job

    private func assignJob(jobId: String, technicianId: String) async {
        do {
            try await DispatchService.shared.assignJob(jobId: jobId, technicianId: technicianId)
            await loadData()
        } catch {
            errorMessage = "Failed to assign job: \(error.localizedDescription)"
        }
    }

    // MARK: - AI Optimize

    private func optimizeDispatch() async {
        isOptimizing = true

        do {
            let result = try await DispatchService.shared.optimizeDispatch()
            let assignmentCount = result.assignments?.count ?? 0
            optimizeMessage = "Optimization complete! \(assignmentCount) assignments made."
            if let warnings = result.warnings, !warnings.isEmpty {
                optimizeMessage += "\n\nWarnings:\n" + warnings.joined(separator: "\n")
            }
            showOptimizeResult = true
            await loadData()
        } catch {
            optimizeMessage = "Optimization failed: \(error.localizedDescription)"
            showOptimizeResult = true
        }

        isOptimizing = false
    }
}

// MARK: - Unassigned Job Card

struct UnassignedJobCard: View {
    let job: UnassignedJob
    let technicians: [DispatchTechnician]
    let onAssign: (String) -> Void

    @State private var showAssignSheet = false

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(job.displayTitle)
                    .font(.subheadline)
                    .fontWeight(.medium)
                Spacer()
                Text(job.priority.capitalized)
                    .font(.caption)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(priorityColor.opacity(0.2))
                    .foregroundColor(priorityColor)
                    .cornerRadius(6)
            }

            if let customer = job.customer {
                Text(customer.displayName)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            if let scheduledDate = job.scheduledStart {
                HStack {
                    Image(systemName: "calendar")
                    Text(scheduledDate, style: .date)
                }
                .font(.caption)
                .foregroundColor(.secondary)
            }

            Button("Assign Technician") {
                showAssignSheet = true
            }
            .font(.caption)
            .buttonStyle(.bordered)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 4, x: 0, y: 2)
        .sheet(isPresented: $showAssignSheet) {
            AssignTechnicianSheet(technicians: technicians) { techId in
                onAssign(techId)
                showAssignSheet = false
            }
        }
    }

    private var priorityColor: Color {
        switch job.priority.lowercased() {
        case "high", "urgent": return .orange
        case "low": return .gray
        default: return .blue
        }
    }
}

// MARK: - Assign Technician Sheet

struct AssignTechnicianSheet: View {
    let technicians: [DispatchTechnician]
    let onSelect: (String) -> Void

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List(technicians) { tech in
                Button(action: { onSelect(tech.id) }) {
                    HStack {
                        VStack(alignment: .leading) {
                            Text(tech.displayName)
                                .font(.headline)
                            Text("\(tech.assignments.count) jobs assigned")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        Spacer()
                        Text(tech.status.capitalized)
                            .font(.caption)
                            .foregroundColor(tech.status.lowercased() == "available" ? .green : .orange)
                    }
                }
                .foregroundColor(.primary)
            }
            .navigationTitle("Select Technician")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}

// MARK: - Dispatch Technician Card

struct DispatchTechnicianCard: View {
    let technician: DispatchTechnician

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Circle()
                    .fill(statusColor)
                    .frame(width: 10, height: 10)
                Text(technician.displayName)
                    .font(.subheadline)
                    .fontWeight(.medium)
                Spacer()
                Text(technician.status.capitalized)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            if !technician.assignments.isEmpty {
                Text("\(technician.assignments.count) assigned jobs")
                    .font(.caption)
                    .foregroundColor(.secondary)

                ForEach(technician.assignments.prefix(3), id: \.job.id) { assignment in
                    HStack {
                        Image(systemName: "wrench.and.screwdriver")
                            .font(.caption2)
                        Text(assignment.job.displayTitle)
                            .font(.caption)
                        Spacer()
                        if let timeWindow = assignment.job.timeWindowStart {
                            Text(timeWindow)
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.leading, 8)
                }

                if technician.assignments.count > 3 {
                    Text("+\(technician.assignments.count - 3) more")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                        .padding(.leading, 8)
                }
            } else {
                Text("No jobs assigned")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 4, x: 0, y: 2)
    }

    private var statusColor: Color {
        switch technician.status.lowercased() {
        case "available": return .green
        case "busy", "on_job": return .orange
        case "offline": return .gray
        default: return .blue
        }
    }
}

#Preview {
    DispatchView()
}
