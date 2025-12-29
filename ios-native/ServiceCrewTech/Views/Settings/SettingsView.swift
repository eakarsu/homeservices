import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var authManager: AuthManager
    @AppStorage("notificationsEnabled") private var notificationsEnabled = true
    @AppStorage("locationEnabled") private var locationEnabled = true
    @AppStorage("darkModeEnabled") private var darkModeEnabled = false
    @State private var showLogoutConfirmation = false

    var body: some View {
        NavigationStack {
            List {
                // User Profile Section
                Section {
                    if let user = authManager.currentUser {
                        HStack(spacing: 16) {
                            Circle()
                                .fill(Color.primaryOrange)
                                .frame(width: 60, height: 60)
                                .overlay(
                                    Text(user.initials)
                                        .font(.title2)
                                        .fontWeight(.bold)
                                        .foregroundColor(.white)
                                )

                            VStack(alignment: .leading, spacing: 4) {
                                Text(user.displayName)
                                    .font(.headline)
                                Text(user.email)
                                    .font(.subheadline)
                                    .foregroundColor(.textSecondary)
                                Text(user.role.rawValue.capitalized)
                                    .font(.caption)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 2)
                                    .background(Color.primaryOrange.opacity(0.2))
                                    .foregroundColor(.primaryOrange)
                                    .cornerRadius(4)
                            }
                        }
                        .padding(.vertical, 8)
                    }
                }

                // Notifications Section
                Section("Notifications") {
                    Toggle(isOn: $notificationsEnabled) {
                        SettingsRow(icon: "bell.fill", title: "Push Notifications", color: .blue)
                    }

                    NavigationLink {
                        NotificationSettingsView()
                    } label: {
                        SettingsRow(icon: "bell.badge.fill", title: "Notification Preferences", color: .blue)
                    }
                }

                // Location Section
                Section("Location") {
                    Toggle(isOn: $locationEnabled) {
                        SettingsRow(icon: "location.fill", title: "Location Services", color: .green)
                    }

                    NavigationLink {
                        LocationSettingsView()
                    } label: {
                        SettingsRow(icon: "map.fill", title: "GPS Settings", color: .green)
                    }
                }

                // Appearance Section
                Section("Appearance") {
                    Toggle(isOn: $darkModeEnabled) {
                        SettingsRow(icon: "moon.fill", title: "Dark Mode", color: .purple)
                    }
                }

                // App Info Section
                Section("About") {
                    NavigationLink {
                        AboutView()
                    } label: {
                        SettingsRow(icon: "info.circle.fill", title: "About", color: .gray)
                    }

                    HStack {
                        SettingsRow(icon: "tag.fill", title: "Version", color: .gray)
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(.textSecondary)
                    }
                }

                // Logout Section
                Section {
                    Button(action: {
                        showLogoutConfirmation = true
                    }) {
                        HStack {
                            Spacer()
                            Text("Sign Out")
                                .foregroundColor(.white)
                            Spacer()
                        }
                        .padding(.vertical, 4)
                    }
                    .listRowBackground(Color.primaryOrange)
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.large)
            .alert("Sign Out", isPresented: $showLogoutConfirmation) {
                Button("Cancel", role: .cancel) {}
                Button("Sign Out", role: .destructive) {
                    authManager.logout()
                }
            } message: {
                Text("Are you sure you want to sign out?")
            }
        }
    }
}

// MARK: - Settings Row
struct SettingsRow: View {
    let icon: String
    let title: String
    let color: Color

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(color)
                .frame(width: 24)
            Text(title)
        }
    }
}

// MARK: - Location Settings View
struct LocationSettingsView: View {
    @EnvironmentObject var locationManager: LocationManager
    @AppStorage("autoTrackLocation") private var autoTrackLocation = true
    @AppStorage("locationAccuracy") private var locationAccuracy = "high"

    var body: some View {
        List {
            Section("Location Tracking") {
                Toggle("Auto-track when on job", isOn: $autoTrackLocation)

                Picker("Accuracy", selection: $locationAccuracy) {
                    Text("High").tag("high")
                    Text("Medium").tag("medium")
                    Text("Low").tag("low")
                }
            }

            Section("Status") {
                HStack {
                    Text("Permission")
                    Spacer()
                    Text(locationManager.hasLocationPermission ? "Granted" : "Denied")
                        .foregroundColor(locationManager.hasLocationPermission ? .green : .orange)
                }

                if !locationManager.hasLocationPermission {
                    Button("Open Settings") {
                        if let url = URL(string: UIApplication.openSettingsURLString) {
                            UIApplication.shared.open(url)
                        }
                    }
                }
            }
        }
        .navigationTitle("Location")
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    SettingsView()
        .environmentObject(AuthManager.shared)
        .environmentObject(LocationManager.shared)
}
