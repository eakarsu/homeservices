import Foundation
import SwiftUI

// MARK: - Auth Manager

@MainActor
class AuthManager: ObservableObject {
    static let shared = AuthManager()

    @Published var currentUser: User?
    @Published var isAuthenticated = false
    @Published var isLoading = true
    @Published var error: String?

    private let tokenKey = "auth_token"
    private let userKey = "current_user"

    var token: String? {
        get { UserDefaults.standard.string(forKey: tokenKey) }
        set {
            if let value = newValue {
                UserDefaults.standard.set(value, forKey: tokenKey)
            } else {
                UserDefaults.standard.removeObject(forKey: tokenKey)
            }
        }
    }

    private init() {
        Task {
            await checkAuthState()
        }
    }

    // MARK: - Auth State

    func checkAuthState() async {
        isLoading = true
        defer { isLoading = false }

        guard token != nil else {
            isAuthenticated = false
            return
        }

        do {
            let user = try await APIService.shared.getCurrentUser()
            currentUser = user
            isAuthenticated = true
        } catch {
            // Token invalid, clear it
            logout()
        }
    }

    // MARK: - Login

    func login(email: String, password: String) async throws {
        isLoading = true
        error = nil

        do {
            let response = try await APIService.shared.login(email: email, password: password)
            token = response.token
            currentUser = response.user
            isAuthenticated = true

            // Register for push notifications after login
            NotificationManager.shared.registerForRemoteNotifications()

            isLoading = false
        } catch let apiError as APIError {
            isLoading = false
            error = apiError.message
            throw apiError
        } catch {
            isLoading = false
            self.error = error.localizedDescription
            throw error
        }
    }

    // MARK: - Logout

    func logout() {
        token = nil
        currentUser = nil
        isAuthenticated = false
        error = nil

        // Clear any cached data
        UserDefaults.standard.removeObject(forKey: userKey)

        // Stop location tracking
        LocationManager.shared.stopUpdatingLocation()
    }

    // MARK: - Helpers

    var userDisplayName: String {
        currentUser?.displayName ?? "Technician"
    }

    var userInitials: String {
        currentUser?.initials ?? "T"
    }

    var isTechnician: Bool {
        currentUser?.isTechnician ?? false
    }
}
