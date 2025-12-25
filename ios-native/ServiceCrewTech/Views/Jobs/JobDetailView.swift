import SwiftUI

struct JobDetailView: View {
    let jobId: String
    @StateObject private var viewModel: JobDetailViewModel
    @State private var selectedTab: JobTab = .details
    @State private var showCamera = false
    @State private var showPhotoPicker = false
    @State private var newNote = ""

    enum JobTab: String, CaseIterable {
        case details = "Details"
        case photos = "Photos"
        case notes = "Notes"
        case parts = "Parts"
        case ai = "AI"
    }

    init(jobId: String) {
        self.jobId = jobId
        _viewModel = StateObject(wrappedValue: JobDetailViewModel(jobId: jobId))
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if let job = viewModel.job {
                    // Customer & Location Card
                    customerLocationCard(job: job)

                    // Action Buttons
                    actionButtons(job: job)

                    // Tab Navigation
                    tabNavigation

                    // Tab Content
                    tabContent(job: job)
                } else if viewModel.isLoading {
                    loadingView
                } else if let error = viewModel.error {
                    errorView(error: error)
                }
            }
            .padding()
        }
        .background(Color.backgroundPrimary)
        .navigationTitle(viewModel.job?.jobNumber ?? "Job")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                if let job = viewModel.job {
                    HStack(spacing: 4) {
                        Text(job.status.displayName)
                            .badge(color: job.status.swiftUIColor)

                        Text(job.priority.displayName)
                            .badge(color: job.priority.swiftUIColor)
                    }
                }
            }
        }
        .task {
            await viewModel.loadJob()
        }
        .sheet(isPresented: $showCamera) {
            ImagePicker(image: $viewModel.capturedImage, sourceType: .camera)
        }
        .sheet(isPresented: $showPhotoPicker) {
            PhotoPicker(images: $viewModel.selectedImages)
        }
        .onChange(of: viewModel.capturedImage) { _, newImage in
            if let image = newImage {
                Task {
                    await viewModel.uploadPhoto(image)
                }
            }
        }
        .onChange(of: viewModel.selectedImages) { _, newImages in
            for image in newImages {
                Task {
                    await viewModel.uploadPhoto(image)
                }
            }
            viewModel.selectedImages = []
        }
    }

    // MARK: - Customer Location Card

    private func customerLocationCard(job: Job) -> some View {
        VStack(spacing: 12) {
            HStack {
                Text(job.customerName)
                    .font(.headline)
                    .foregroundColor(.textPrimary)

                Spacer()

                if let phone = job.customer?.phone {
                    Button(action: { phone.callPhoneNumber() }) {
                        Image(systemName: "phone.fill")
                            .foregroundColor(.white)
                            .padding(10)
                            .background(Color.secondaryGreen)
                            .clipShape(Circle())
                    }
                }
            }

            Button(action: { job.fullAddress.openInMaps() }) {
                HStack(alignment: .top, spacing: 8) {
                    Image(systemName: "mappin.circle.fill")
                        .foregroundColor(.primaryOrange)

                    Text(job.fullAddress)
                        .font(.subheadline)
                        .foregroundColor(.textSecondary)
                        .multilineTextAlignment(.leading)

                    Spacer()

                    Image(systemName: "arrow.up.right")
                        .font(.caption)
                        .foregroundColor(.primaryOrange)
                }
            }

            if let timeStart = job.timeWindowStart, let timeEnd = job.timeWindowEnd {
                HStack(spacing: 8) {
                    Image(systemName: "clock.fill")
                        .foregroundColor(.textTertiary)

                    Text("\(timeStart) - \(timeEnd)")
                        .font(.subheadline)
                        .foregroundColor(.textSecondary)

                    if let duration = job.estimatedDuration {
                        Text("(\(duration) min)")
                            .font(.caption)
                            .foregroundColor(.textTertiary)
                    }
                }
            }
        }
        .padding()
        .cardStyle()
    }

    // MARK: - Action Buttons

    private func actionButtons(job: Job) -> some View {
        HStack(spacing: 12) {
            if job.canStart {
                Button(action: { viewModel.updateStatus(.inProgress) }) {
                    HStack {
                        Image(systemName: "play.fill")
                        Text("Start Job")
                    }
                    .primaryButtonStyle()
                }
            }

            if job.canPause {
                Button(action: { viewModel.updateStatus(.onHold) }) {
                    HStack {
                        Image(systemName: "pause.fill")
                        Text("Pause")
                    }
                    .secondaryButtonStyle()
                }
            }

            if job.canComplete {
                Button(action: { viewModel.updateStatus(.completed) }) {
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                        Text("Complete")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.secondaryGreen)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
            }
        }
        .disabled(viewModel.isUpdatingStatus)
    }

    // MARK: - Tab Navigation

    private var tabNavigation: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 0) {
                ForEach(JobTab.allCases, id: \.self) { tab in
                    Button(action: { selectedTab = tab }) {
                        VStack(spacing: 8) {
                            HStack(spacing: 4) {
                                if tab == .photos {
                                    Image(systemName: "camera.fill")
                                } else if tab == .ai {
                                    Image(systemName: "sparkles")
                                }
                                Text(tab.rawValue)
                                if tab == .photos && !viewModel.photos.isEmpty {
                                    Text("(\(viewModel.photos.count))")
                                }
                            }
                            .font(.subheadline)
                            .fontWeight(selectedTab == tab ? .semibold : .regular)
                            .foregroundColor(selectedTab == tab ? .primaryOrange : .textSecondary)

                            Rectangle()
                                .fill(selectedTab == tab ? Color.primaryOrange : Color.clear)
                                .frame(height: 2)
                        }
                    }
                    .frame(minWidth: 70)
                }
            }
        }
        .background(Color.white)
        .cornerRadius(12)
    }

    // MARK: - Tab Content

    @ViewBuilder
    private func tabContent(job: Job) -> some View {
        switch selectedTab {
        case .details:
            detailsTab(job: job)
        case .photos:
            photosTab(job: job)
        case .notes:
            notesTab(job: job)
        case .parts:
            partsTab(job: job)
        case .ai:
            aiTab(job: job)
        }
    }

    // MARK: - Details Tab

    private func detailsTab(job: Job) -> some View {
        VStack(spacing: 16) {
            if let description = job.description, !description.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Label("Description", systemImage: "doc.text.fill")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.textSecondary)

                    Text(description)
                        .font(.body)
                        .foregroundColor(.textPrimary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding()
                .cardStyle()
            }

            VStack(alignment: .leading, spacing: 12) {
                Label("Service Info", systemImage: "wrench.and.screwdriver.fill")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.textSecondary)

                infoRow(label: "Type", value: job.serviceType?.name ?? "Not specified")
                infoRow(label: "Trade", value: job.tradeType.displayName)
                if let scheduled = job.scheduledStart {
                    infoRow(label: "Scheduled", value: scheduled.formattedDateTime)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding()
            .cardStyle()
        }
    }

    private func infoRow(label: String, value: String) -> some View {
        HStack {
            Text(label)
                .font(.subheadline)
                .foregroundColor(.textSecondary)

            Spacer()

            Text(value)
                .font(.subheadline)
                .foregroundColor(.textPrimary)
        }
    }

    // MARK: - Photos Tab

    private func photosTab(job: Job) -> some View {
        VStack(spacing: 16) {
            // Camera buttons
            HStack(spacing: 12) {
                Button(action: { showCamera = true }) {
                    HStack {
                        Image(systemName: "camera.fill")
                        Text(viewModel.isUploadingPhoto ? "Capturing..." : "Take Photo")
                    }
                    .primaryButtonStyle()
                }
                .disabled(viewModel.isUploadingPhoto)

                Button(action: { showPhotoPicker = true }) {
                    HStack {
                        Image(systemName: "photo.fill")
                        Text("Choose Photo")
                    }
                    .secondaryButtonStyle()
                }
            }

            // GPS info
            if let location = LocationManager.shared.location {
                HStack(spacing: 4) {
                    Image(systemName: "location.fill")
                        .font(.caption)
                    Text("GPS: \(location.coordinate.latitude, specifier: "%.6f"), \(location.coordinate.longitude, specifier: "%.6f")")
                        .font(.caption)
                }
                .foregroundColor(.textTertiary)
            }

            // Photo grid
            if viewModel.photos.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "camera.fill")
                        .font(.system(size: 40))
                        .foregroundColor(.textTertiary)

                    Text("No photos yet")
                        .font(.subheadline)
                        .foregroundColor(.textSecondary)

                    Text("Take or choose photos of the job site")
                        .font(.caption)
                        .foregroundColor(.textTertiary)
                }
                .frame(maxWidth: .infinity)
                .padding(32)
            } else {
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    ForEach(viewModel.photos) { photo in
                        AsyncImage(url: URL(string: photo.url)) { image in
                            image
                                .resizable()
                                .aspectRatio(1, contentMode: .fill)
                                .clipped()
                        } placeholder: {
                            Rectangle()
                                .fill(Color.backgroundSecondary)
                        }
                        .frame(height: 150)
                        .cornerRadius(12)
                    }
                }
            }

            // Photo tips
            VStack(alignment: .leading, spacing: 8) {
                Text("Photo Tips")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.secondaryBlue)

                VStack(alignment: .leading, spacing: 4) {
                    tipRow("Take before & after photos of work")
                    tipRow("Capture equipment model/serial numbers")
                    tipRow("Document any existing damage")
                    tipRow("Photos are tagged with GPS location")
                }
            }
            .padding()
            .background(Color.secondaryBlue.opacity(0.1))
            .cornerRadius(12)
        }
    }

    private func tipRow(_ text: String) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Text("•")
            Text(text)
        }
        .font(.caption)
        .foregroundColor(.secondaryBlue)
    }

    // MARK: - Notes Tab

    private func notesTab(job: Job) -> some View {
        VStack(spacing: 16) {
            // Add note input
            HStack {
                TextField("Add a note...", text: $newNote)
                    .textFieldStyle(.plain)
                    .padding()
                    .background(Color.backgroundSecondary)
                    .cornerRadius(12)

                Button(action: addNote) {
                    Text("Add")
                        .fontWeight(.medium)
                        .foregroundColor(.white)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .background(newNote.isEmpty ? Color.primaryOrange.opacity(0.5) : Color.primaryOrange)
                        .cornerRadius(12)
                }
                .disabled(newNote.isEmpty || viewModel.isAddingNote)
            }

            // Notes list
            if job.notes.isEmpty {
                Text("No notes yet")
                    .font(.subheadline)
                    .foregroundColor(.textSecondary)
                    .padding(32)
            } else {
                ForEach(job.notes) { note in
                    VStack(alignment: .leading, spacing: 8) {
                        Text(note.content)
                            .font(.body)
                            .foregroundColor(.textPrimary)

                        HStack {
                            Text(note.noteType.rawValue)
                                .font(.caption)
                                .foregroundColor(.textTertiary)

                            Spacer()

                            Text(note.createdAt.timeAgo)
                                .font(.caption)
                                .foregroundColor(.textTertiary)
                        }
                    }
                    .padding()
                    .background(Color.backgroundSecondary)
                    .cornerRadius(12)
                }
            }
        }
    }

    private func addNote() {
        guard !newNote.isEmpty else { return }
        let noteContent = newNote
        newNote = ""
        Task {
            await viewModel.addNote(noteContent)
        }
    }

    // MARK: - Parts Tab

    private func partsTab(job: Job) -> some View {
        VStack(spacing: 16) {
            Button(action: { /* TODO: Add parts */ }) {
                HStack {
                    Image(systemName: "plus.circle.fill")
                    Text("Add Parts Used")
                }
                .secondaryButtonStyle()
            }

            if job.partsUsed.isEmpty {
                Text("No parts added yet")
                    .font(.subheadline)
                    .foregroundColor(.textSecondary)
                    .padding(32)
            } else {
                ForEach(job.partsUsed) { item in
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(item.description)
                                .font(.subheadline)
                                .fontWeight(.medium)
                                .foregroundColor(.textPrimary)

                            Text("Qty: \(Int(item.quantity))")
                                .font(.caption)
                                .foregroundColor(.textSecondary)
                        }

                        Spacer()

                        Text(item.totalPrice.asCurrency)
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .foregroundColor(.textPrimary)
                    }
                    .padding()
                    .background(Color.backgroundSecondary)
                    .cornerRadius(12)
                }
            }
        }
    }

    // MARK: - AI Tab

    private func aiTab(job: Job) -> some View {
        AIAssistantView(
            tradeType: job.tradeType,
            diagnosticResult: $viewModel.diagnosticResult,
            isLoading: viewModel.isLoadingDiagnostics,
            onSubmit: { symptoms in
                Task {
                    await viewModel.getDiagnostics(symptoms: symptoms)
                }
            }
        )
    }

    // MARK: - Loading & Error Views

    private var loadingView: some View {
        VStack {
            ProgressView()
                .scaleEffect(1.5)
            Text("Loading job...")
                .font(.subheadline)
                .foregroundColor(.textSecondary)
                .padding(.top)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(64)
    }

    private func errorView(error: String) -> some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 40))
                .foregroundColor(.secondaryRed)

            Text("Error loading job")
                .font(.headline)
                .foregroundColor(.textPrimary)

            Text(error)
                .font(.subheadline)
                .foregroundColor(.textSecondary)
                .multilineTextAlignment(.center)

            Button(action: { Task { await viewModel.loadJob() } }) {
                Text("Try Again")
                    .primaryButtonStyle()
            }
        }
        .padding(32)
    }
}

// MARK: - Job Detail View Model

@MainActor
class JobDetailViewModel: ObservableObject {
    let jobId: String

    @Published var job: Job?
    @Published var photos: [JobPhoto] = []
    @Published var isLoading = false
    @Published var isUpdatingStatus = false
    @Published var isUploadingPhoto = false
    @Published var isAddingNote = false
    @Published var isLoadingDiagnostics = false
    @Published var error: String?
    @Published var capturedImage: UIImage?
    @Published var selectedImages: [UIImage] = []
    @Published var diagnosticResult: DiagnosticResult?

    init(jobId: String) {
        self.jobId = jobId
    }

    func loadJob() async {
        isLoading = true
        error = nil

        do {
            job = try await APIService.shared.getJob(id: jobId)
            photos = job?.photos ?? []
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func updateStatus(_ status: JobStatus) {
        isUpdatingStatus = true

        Task {
            do {
                job = try await APIService.shared.updateJobStatus(id: jobId, status: status)
            } catch {
                self.error = error.localizedDescription
            }
            isUpdatingStatus = false
        }
    }

    func uploadPhoto(_ image: UIImage) async {
        isUploadingPhoto = true

        guard let imageData = CameraManager.shared.processImage(image) else {
            isUploadingPhoto = false
            return
        }

        do {
            let photo = try await APIService.shared.uploadJobPhoto(
                jobId: jobId,
                imageData: imageData,
                photoType: .during
            )
            photos.append(photo)
        } catch {
            self.error = error.localizedDescription
        }

        capturedImage = nil
        isUploadingPhoto = false
    }

    func addNote(_ content: String) async {
        isAddingNote = true

        do {
            let note = try await APIService.shared.addJobNote(jobId: jobId, content: content)
            job?.notes.append(note)
        } catch {
            self.error = error.localizedDescription
        }

        isAddingNote = false
    }

    func getDiagnostics(symptoms: String) async {
        isLoadingDiagnostics = true

        do {
            diagnosticResult = try await APIService.shared.getDiagnostics(
                equipmentType: job?.tradeType.rawValue ?? "HVAC",
                symptoms: symptoms
            )
        } catch {
            self.error = error.localizedDescription
        }

        isLoadingDiagnostics = false
    }
}

#Preview {
    NavigationStack {
        JobDetailView(jobId: "test-job-id")
    }
}
