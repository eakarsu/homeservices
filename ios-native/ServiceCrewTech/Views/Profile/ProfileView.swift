import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var locationManager: LocationManager
    @State private var showLogoutConfirmation = false

    var body: some View {
        NavigationStack {
            List {
                // Profile header
                Section {
                    HStack(spacing: 16) {
                        // Avatar
                        Text(authManager.userInitials)
                            .font(.title)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                            .frame(width: 70, height: 70)
                            .background(Color.primaryOrange)
                            .clipShape(Circle())

                        VStack(alignment: .leading, spacing: 4) {
                            Text(authManager.userDisplayName)
                                .font(.title3)
                                .fontWeight(.semibold)
                                .foregroundColor(.textPrimary)

                            Text(authManager.currentUser?.email ?? "")
                                .font(.subheadline)
                                .foregroundColor(.textSecondary)

                            if let role = authManager.currentUser?.role {
                                Text(role.rawValue.capitalized)
                                    .font(.caption)
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Color.primaryOrange)
                                    .cornerRadius(8)
                            }
                        }
                    }
                    .padding(.vertical, 8)
                }

                // Status section
                Section("Status") {
                    if let technician = authManager.currentUser?.technician {
                        HStack {
                            Label("Status", systemImage: "circle.fill")
                                .foregroundColor(statusColor(technician.status))

                            Spacer()

                            Text(technician.status?.displayName ?? "Unknown")
                                .foregroundColor(.textSecondary)
                        }

                        if technician.hasLocation {
                            HStack {
                                Label("Location", systemImage: "location.fill")

                                Spacer()

                                Text(locationManager.coordinateString)
                                    .font(.caption)
                                    .foregroundColor(.textSecondary)
                            }
                        }
                    }

                    Toggle(isOn: Binding(
                        get: { locationManager.isUpdatingLocation },
                        set: { newValue in
                            if newValue {
                                locationManager.startUpdatingLocation()
                            } else {
                                locationManager.stopUpdatingLocation()
                            }
                        }
                    )) {
                        Label("Location Tracking", systemImage: "location.circle")
                    }
                    .tint(Color.primaryOrange)
                }

                // Skills section
                if let technician = authManager.currentUser?.technician {
                    Section("Skills & Certifications") {
                        if let skills = technician.skills, !skills.isEmpty {
                            ForEach(skills, id: \.self) { skill in
                                Label(skill, systemImage: "checkmark.circle.fill")
                                    .foregroundColor(.secondaryGreen)
                            }
                        }

                        if let certs = technician.certifications, !certs.isEmpty {
                            ForEach(certs, id: \.self) { cert in
                                Label(cert, systemImage: "rosette")
                                    .foregroundColor(.primaryOrange)
                            }
                        }
                    }
                }

                // Management section (for admin/dispatcher)
                if authManager.currentUser?.role == .admin || authManager.currentUser?.role == .dispatcher {
                    Section("Management") {
                        NavigationLink(destination: DispatchView()) {
                            Label("Dispatch", systemImage: "map.fill")
                        }

                        NavigationLink(destination: TechniciansView()) {
                            Label("Technicians", systemImage: "person.3.fill")
                        }

                        NavigationLink(destination: AgreementsView()) {
                            Label("Agreements", systemImage: "doc.text.fill")
                        }

                        NavigationLink(destination: ReportsView()) {
                            Label("Reports", systemImage: "chart.bar.fill")
                        }
                    }
                }

                // App settings
                Section("Settings") {
                    NavigationLink(destination: NotificationSettingsView()) {
                        Label("Notifications", systemImage: "bell.fill")
                    }

                    NavigationLink(destination: AppearanceSettingsView()) {
                        Label("Appearance", systemImage: "paintbrush.fill")
                    }

                    NavigationLink(destination: AboutView()) {
                        Label("About", systemImage: "info.circle.fill")
                    }
                }

                // Logout
                Section {
                    Button(action: { showLogoutConfirmation = true }) {
                        HStack {
                            Spacer()
                            Label("Sign Out", systemImage: "rectangle.portrait.and.arrow.right")
                                .foregroundColor(.secondaryRed)
                            Spacer()
                        }
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Profile")
            .confirmationDialog(
                "Sign Out",
                isPresented: $showLogoutConfirmation,
                titleVisibility: .visible
            ) {
                Button("Sign Out", role: .destructive) {
                    authManager.logout()
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("Are you sure you want to sign out?")
            }
        }
    }

    private func statusColor(_ status: Technician.TechnicianStatus?) -> Color {
        switch status {
        case .available: return .secondaryGreen
        case .busy: return .primaryOrange
        case .onBreak: return .secondaryYellow
        case .offline, .none: return .textTertiary
        }
    }
}

// MARK: - Settings Views

struct NotificationSettingsView: View {
    @State private var jobAlerts = true
    @State private var scheduleChanges = true
    @State private var messageAlerts = true

    var body: some View {
        List {
            Section("Push Notifications") {
                Toggle("New Job Assignments", isOn: $jobAlerts)
                Toggle("Schedule Changes", isOn: $scheduleChanges)
                Toggle("Messages", isOn: $messageAlerts)
            }
            .tint(Color.primaryOrange)
        }
        .listStyle(.insetGrouped)
        .navigationTitle("Notifications")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct AppearanceSettingsView: View {
    @AppStorage("colorScheme") private var colorScheme = 0

    var body: some View {
        List {
            Section("Theme") {
                Picker("Appearance", selection: $colorScheme) {
                    Text("System").tag(0)
                    Text("Light").tag(1)
                    Text("Dark").tag(2)
                }
                .pickerStyle(.segmented)
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("Appearance")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct AboutView: View {
    var body: some View {
        List {
            Section {
                HStack {
                    Spacer()
                    VStack(spacing: 12) {
                        Image(systemName: "wrench.and.screwdriver.fill")
                            .font(.system(size: 60))
                            .foregroundColor(.primaryOrange)

                        Text("ServiceCrew Tech")
                            .font(.title2)
                            .fontWeight(.bold)

                        Text("Version 1.0.0")
                            .font(.subheadline)
                            .foregroundColor(.textSecondary)
                    }
                    .padding(.vertical, 24)
                    Spacer()
                }
            }

            Section {
                Link(destination: URL(string: "https://servicecrewai.com/privacy")!) {
                    Label("Privacy Policy", systemImage: "hand.raised.fill")
                }

                Link(destination: URL(string: "https://servicecrewai.com/terms")!) {
                    Label("Terms of Service", systemImage: "doc.text.fill")
                }

                Link(destination: URL(string: "https://servicecrewai.com/support")!) {
                    Label("Support", systemImage: "questionmark.circle.fill")
                }
            }

            Section {
                Text("© 2024 ServiceCrew AI. All rights reserved.")
                    .font(.caption)
                    .foregroundColor(.textTertiary)
                    .frame(maxWidth: .infinity, alignment: .center)
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("About")
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    ProfileView()
        .environmentObject(AuthManager.shared)
        .environmentObject(LocationManager.shared)
}
