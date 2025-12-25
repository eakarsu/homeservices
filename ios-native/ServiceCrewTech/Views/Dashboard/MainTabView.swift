import SwiftUI

struct MainTabView: View {
    @State private var selectedTab = 0
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var locationManager: LocationManager

    var body: some View {
        TabView(selection: $selectedTab) {
            HomeView()
                .tabItem {
                    Label("Home", systemImage: "house.fill")
                }
                .tag(0)

            JobsListView()
                .tabItem {
                    Label("Jobs", systemImage: "wrench.and.screwdriver.fill")
                }
                .tag(1)

            ScheduleView()
                .tabItem {
                    Label("Schedule", systemImage: "calendar")
                }
                .tag(2)

            InventoryView()
                .tabItem {
                    Label("Inventory", systemImage: "cube.fill")
                }
                .tag(3)

            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person.fill")
                }
                .tag(4)
        }
        .tint(Color.primaryOrange)
        .onAppear {
            // Start location tracking when app appears
            if locationManager.hasLocationPermission {
                locationManager.startUpdatingLocation()
            } else {
                locationManager.requestPermission()
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .navigateToJob)) { notification in
            // Handle push notification navigation
            if let jobId = notification.userInfo?["jobId"] as? String {
                // Navigate to jobs tab and then to job detail
                selectedTab = 1
            }
        }
    }
}

#Preview {
    MainTabView()
        .environmentObject(AuthManager.shared)
        .environmentObject(LocationManager.shared)
}
