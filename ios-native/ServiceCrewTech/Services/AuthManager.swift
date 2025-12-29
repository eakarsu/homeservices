import Foundation
import SwiftUI
import AuthenticationServices

// MARK: - Auth Manager

@MainActor
class AuthManager: ObservableObject {
    static let shared = AuthManager()

    @Published var currentUser: User?
    @Published var isAuthenticated = false
    @Published var isLoading = true
    @Published var error: String?
    @Published var isAppleSignInProcessing = false

    private let tokenKey = "auth_token"
    private let userKey = "current_user"
    private let appleSignInManager = AppleSignInManager.shared

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
        // Clear any stale auth data on fresh install
        if UserDefaults.standard.object(forKey: "app_installed") == nil {
            logout()
            UserDefaults.standard.set(true, forKey: "app_installed")
        }

        Task {
            await checkAuthState()
            setupAppleIDCredentialRevokedObserver()
        }
    }

    // MARK: - Apple ID Credential Observer

    private func setupAppleIDCredentialRevokedObserver() {
        NotificationCenter.default.addObserver(
            forName: ASAuthorizationAppleIDProvider.credentialRevokedNotification,
            object: nil,
            queue: nil
        ) { [weak self] _ in
            Task { @MainActor [weak self] in
                self?.logout()
            }
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

    // MARK: - Apple Sign In

    func signInWithApple() async -> Bool {
        isAppleSignInProcessing = true
        error = nil

        do {
            // Get credentials from Apple
            let credentials = try await appleSignInManager.signIn()

            // Send credentials to backend for authentication
            let response = try await APIService.shared.loginWithApple(
                identityToken: credentials.identityToken,
                authorizationCode: credentials.authorizationCode,
                nonce: credentials.nonce,
                userIdentifier: credentials.userIdentifier,
                email: credentials.email,
                firstName: credentials.firstName,
                lastName: credentials.lastName
            )

            token = response.token
            currentUser = response.user
            isAuthenticated = true
            isAppleSignInProcessing = false

            // Register for push notifications after login
            NotificationManager.shared.registerForRemoteNotifications()

            return true
        } catch let appleError as AppleSignInError {
            if case .canceled = appleError {
                error = nil
            } else {
                error = appleError.errorDescription
            }
            isAppleSignInProcessing = false
            return false
        } catch let apiError as APIError {
            error = apiError.message
            isAppleSignInProcessing = false
            return false
        } catch {
            self.error = error.localizedDescription
            isAppleSignInProcessing = false
            return false
        }
    }

    /// Checks if the stored Apple ID credential is still valid
    func checkAppleIDCredentialState() async {
        guard let userID = UserDefaults.standard.string(forKey: "appleUserIdentifier") else {
            return
        }

        let state = await appleSignInManager.checkCredentialState(userID: userID)

        switch state {
        case .revoked:
            logout()
        case .authorized, .notFound, .transferred:
            break
        @unknown default:
            break
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
