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

            CustomersView()
                .tabItem {
                    Label("Customers", systemImage: "person.2.fill")
                }
                .tag(2)

            EstimatesView()
                .tabItem {
                    Label("Estimates", systemImage: "doc.text.fill")
                }
                .tag(3)

            InvoicesView()
                .tabItem {
                    Label("Invoices", systemImage: "dollarsign.circle.fill")
                }
                .tag(4)

            MoreView()
                .tabItem {
                    Label("More", systemImage: "ellipsis.circle.fill")
                }
                .tag(5)
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
