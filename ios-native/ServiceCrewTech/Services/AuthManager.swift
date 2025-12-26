import Foundation
import SwiftUI
import AuthenticationServices
import CryptoKit

// MARK: - Auth Manager

@MainActor
class AuthManager: NSObject, ObservableObject {
    static let shared = AuthManager()

    @Published var currentUser: User?
    @Published var isAuthenticated = false
    @Published var isLoading = true
    @Published var error: String?

    private let tokenKey = "auth_token"
    private let userKey = "current_user"
    private let appleUserIdKey = "apple_user_id"

    // Apple Sign In
    private var currentNonce: String?
    @Published var appleSignInError: String?

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

    // MARK: - Sign in with Apple

    func startAppleSignIn() -> ASAuthorizationAppleIDRequest {
        let nonce = randomNonceString()
        currentNonce = nonce

        let appleIDProvider = ASAuthorizationAppleIDProvider()
        let request = appleIDProvider.createRequest()
        request.requestedScopes = [.fullName, .email]
        request.nonce = sha256(nonce)

        return request
    }

    func handleAppleSignIn(result: Result<ASAuthorization, Error>) async {
        switch result {
        case .success(let authorization):
            await processAppleAuthorization(authorization)
        case .failure(let error):
            appleSignInError = error.localizedDescription
            self.error = error.localizedDescription
        }
    }

    private func processAppleAuthorization(_ authorization: ASAuthorization) async {
        guard let appleIDCredential = authorization.credential as? ASAuthorizationAppleIDCredential else {
            appleSignInError = "Invalid credential type"
            return
        }

        guard let nonce = currentNonce else {
            appleSignInError = "Invalid state: no nonce"
            return
        }

        guard let appleIDToken = appleIDCredential.identityToken,
              let idTokenString = String(data: appleIDToken, encoding: .utf8) else {
            appleSignInError = "Unable to get identity token"
            return
        }

        isLoading = true
        error = nil

        do {
            // Get user info from Apple
            let userIdentifier = appleIDCredential.user
            let fullName = appleIDCredential.fullName
            let email = appleIDCredential.email

            // Store Apple user ID for future credential checks
            UserDefaults.standard.set(userIdentifier, forKey: appleUserIdKey)

            // Send to your backend for verification and user creation/login
            let response = try await APIService.shared.loginWithApple(
                identityToken: idTokenString,
                authorizationCode: String(data: appleIDCredential.authorizationCode ?? Data(), encoding: .utf8) ?? "",
                userIdentifier: userIdentifier,
                email: email,
                fullName: fullName
            )

            token = response.token
            currentUser = response.user
            isAuthenticated = true

            // Register for push notifications
            NotificationManager.shared.registerForRemoteNotifications()

            isLoading = false
        } catch let apiError as APIError {
            isLoading = false
            error = apiError.message
            appleSignInError = apiError.message
        } catch {
            isLoading = false
            self.error = error.localizedDescription
            appleSignInError = error.localizedDescription
        }
    }

    func checkAppleCredentialState() async {
        guard let userID = UserDefaults.standard.string(forKey: appleUserIdKey) else { return }

        let appleIDProvider = ASAuthorizationAppleIDProvider()
        do {
            let credentialState = try await appleIDProvider.credentialState(forUserID: userID)
            switch credentialState {
            case .revoked, .notFound:
                // User has revoked access or not found, log them out
                logout()
            case .authorized:
                // Still authorized
                break
            case .transferred:
                // Handle transferred state if needed
                break
            @unknown default:
                break
            }
        } catch {
            print("Error checking Apple credential state: \(error)")
        }
    }

    // MARK: - Crypto Helpers

    private func randomNonceString(length: Int = 32) -> String {
        precondition(length > 0)
        var randomBytes = [UInt8](repeating: 0, count: length)
        let errorCode = SecRandomCopyBytes(kSecRandomDefault, randomBytes.count, &randomBytes)
        if errorCode != errSecSuccess {
            fatalError("Unable to generate nonce. SecRandomCopyBytes failed with OSStatus \(errorCode)")
        }

        let charset: [Character] = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
        let nonce = randomBytes.map { byte in
            charset[Int(byte) % charset.count]
        }
        return String(nonce)
    }

    private func sha256(_ input: String) -> String {
        let inputData = Data(input.utf8)
        let hashedData = SHA256.hash(data: inputData)
        let hashString = hashedData.compactMap {
            String(format: "%02x", $0)
        }.joined()
        return hashString
    }
}
