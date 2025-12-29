import SwiftUI

struct MoreView: View {
    @EnvironmentObject var authManager: AuthManager

    var body: some View {
        NavigationStack {
            List {
                // AI Features Section
                Section("AI Features") {
                    NavigationLink(destination: AIFeaturesView()) {
                        HStack {
                            Image(systemName: "sparkles")
                                .foregroundColor(.primaryOrange)
                            Text("AI Assistant")
                                .foregroundColor(.primary)
                            Spacer()
                            Text("New")
                                .font(.caption2)
                                .fontWeight(.semibold)
                                .foregroundColor(.white)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 2)
                                .background(Color.primaryOrange)
                                .clipShape(Capsule())
                        }
                    }
                }

                // Management Section
                Section("Management") {
                    NavigationLink(destination: DispatchView()) {
                        Label("Dispatch", systemImage: "map.fill")
                            .foregroundColor(.primary)
                    }

                    NavigationLink(destination: TechniciansView()) {
                        Label("Technicians", systemImage: "person.3.fill")
                            .foregroundColor(.primary)
                    }

                    NavigationLink(destination: AgreementsView()) {
                        Label("Agreements", systemImage: "doc.text.fill")
                            .foregroundColor(.primary)
                    }

                    NavigationLink(destination: ReportsView()) {
                        Label("Reports", systemImage: "chart.bar.fill")
                            .foregroundColor(.primary)
                    }
                }

                // Account Section
                Section("Account") {
                    NavigationLink(destination: ProfileView()) {
                        HStack {
                            Text(authManager.userInitials)
                                .font(.headline)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                                .frame(width: 40, height: 40)
                                .background(Color.primaryOrange)
                                .clipShape(Circle())

                            VStack(alignment: .leading, spacing: 2) {
                                Text(authManager.userDisplayName)
                                    .font(.headline)
                                Text(authManager.currentUser?.email ?? "")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("More")
        }
    }
}

#Preview {
    MoreView()
        .environmentObject(AuthManager.shared)
}
