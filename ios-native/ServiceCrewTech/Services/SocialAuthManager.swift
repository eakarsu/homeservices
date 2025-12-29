import Foundation
import AuthenticationServices
import SwiftUI

@MainActor
class SocialAuthManager: NSObject, ObservableObject {
    static let shared = SocialAuthManager()

    @Published var isLoading = false
    @Published var error: String?

    // OAuth Configuration - Update these with your client IDs
    private let googleClientID = "617052667836-9op6tcp5987p3n0qpaj1kqj7dastrt24.apps.googleusercontent.com"
    private let microsoftClientID = "39a86690-eb17-4c50-93c1-9d31ed5cb30b"
    private let redirectScheme = "com.servicecrew.tech"

    private var webAuthSession: ASWebAuthenticationSession?

    private override init() {
        super.init()
    }

    // MARK: - Google Sign-In
    func signInWithGoogle() async {
        isLoading = true
        error = nil

        let scopes = "openid email profile"
        let encodedScopes = scopes.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? scopes
        let googleURLScheme = "com.googleusercontent.apps.\(googleClientID.components(separatedBy: ".").first ?? "")"
        let redirectURI = "\(googleURLScheme):/oauth2redirect"
        let encodedRedirectURI = redirectURI.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? redirectURI

        let authURL = URL(string: "https://accounts.google.com/o/oauth2/v2/auth?client_id=\(googleClientID)&redirect_uri=\(encodedRedirectURI)&response_type=code&scope=\(encodedScopes)&access_type=offline&prompt=consent")!

        await startWebAuthSession(url: authURL, callbackScheme: googleURLScheme, provider: "google")
    }

    // MARK: - Microsoft Sign-In
    func signInWithMicrosoft() async {
        isLoading = true
        error = nil

        let scopes = "openid email profile User.Read"
        let encodedScopes = scopes.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? scopes
        let redirectURI = "\(redirectScheme)://oauth/microsoft"
        let encodedRedirectURI = redirectURI.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? redirectURI

        let authURL = URL(string: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=\(microsoftClientID)&redirect_uri=\(encodedRedirectURI)&response_type=code&scope=\(encodedScopes)&response_mode=query")!

        await startWebAuthSession(url: authURL, callbackScheme: redirectScheme, provider: "microsoft")
    }

    // MARK: - Web Auth Session
    private func startWebAuthSession(url: URL, callbackScheme: String, provider: String) async {
        await withCheckedContinuation { continuation in
            webAuthSession = ASWebAuthenticationSession(
                url: url,
                callbackURLScheme: callbackScheme
            ) { [weak self] callbackURL, error in
                Task { @MainActor in
                    if let error = error {
                        if (error as NSError).code == ASWebAuthenticationSessionError.canceledLogin.rawValue {
                            self?.error = nil // User cancelled
                        } else {
                            self?.error = error.localizedDescription
                        }
                        self?.isLoading = false
                        continuation.resume()
                        return
                    }

                    guard let callbackURL = callbackURL,
                          let code = URLComponents(url: callbackURL, resolvingAgainstBaseURL: false)?
                            .queryItems?.first(where: { $0.name == "code" })?.value else {
                        self?.error = "Failed to get authorization code"
                        self?.isLoading = false
                        continuation.resume()
                        return
                    }

                    // Exchange code for token via backend
                    await self?.exchangeCodeForToken(code: code, provider: provider)
                    continuation.resume()
                }
            }

            webAuthSession?.presentationContextProvider = self
            webAuthSession?.prefersEphemeralWebBrowserSession = false
            webAuthSession?.start()
        }
    }

    // MARK: - Exchange Code for Token
    private func exchangeCodeForToken(code: String, provider: String) async {
        if provider == "google" {
            await exchangeGoogleCode(code: code)
        } else if provider == "microsoft" {
            await exchangeMicrosoftCode(code: code)
        }
    }

    private func exchangeGoogleCode(code: String) async {
        do {
            // Exchange code with Google directly
            let tokenURL = URL(string: "https://oauth2.googleapis.com/token")!
            var request = URLRequest(url: tokenURL)
            request.httpMethod = "POST"
            request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")

            let googleURLScheme = "com.googleusercontent.apps.\(googleClientID.components(separatedBy: ".").first ?? "")"
            let redirectURI = "\(googleURLScheme):/oauth2redirect"

            let body = "code=\(code)&client_id=\(googleClientID)&redirect_uri=\(redirectURI)&grant_type=authorization_code"
            request.httpBody = body.data(using: .utf8)

            let (data, response) = try await URLSession.shared.data(for: request)

            if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode != 200 {
                let responseString = String(data: data, encoding: .utf8) ?? "Unknown error"
                self.error = "Google token error: \(responseString)"
                isLoading = false
                return
            }

            let tokenResponse = try JSONDecoder().decode(GoogleTokenResponse.self, from: data)

            // Get user info from Google
            let userInfoURL = URL(string: "https://www.googleapis.com/oauth2/v2/userinfo")!
            var userRequest = URLRequest(url: userInfoURL)
            userRequest.setValue("Bearer \(tokenResponse.access_token)", forHTTPHeaderField: "Authorization")

            let (userData, userResponse) = try await URLSession.shared.data(for: userRequest)

            if let httpResponse = userResponse as? HTTPURLResponse, httpResponse.statusCode != 200 {
                let userDataString = String(data: userData, encoding: .utf8) ?? "No data"
                self.error = "Failed to get user info: \(userDataString)"
                isLoading = false
                return
            }

            let googleUser = try JSONDecoder().decode(GoogleUserInfo.self, from: userData)

            // Send to backend for authentication
            let baseURL = ProcessInfo.processInfo.environment["API_BASE_URL"] ?? "https://servicecrewai.com/api"
            let backendURL = URL(string: "\(baseURL)/mobile-auth")!
            var backendRequest = URLRequest(url: backendURL)
            backendRequest.httpMethod = "POST"
            backendRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")

            let authBody: [String: Any] = [
                "provider": "google",
                "email": googleUser.email,
                "name": googleUser.name,
                "providerId": googleUser.id,
                "accessToken": tokenResponse.access_token
            ]
            backendRequest.httpBody = try JSONSerialization.data(withJSONObject: authBody)

            let (backendData, backendResponse) = try await URLSession.shared.data(for: backendRequest)

            if let httpResponse = backendResponse as? HTTPURLResponse, httpResponse.statusCode != 200 {
                let errorString = String(data: backendData, encoding: .utf8) ?? "Unknown error"
                self.error = "Backend error: \(errorString)"
                isLoading = false
                return
            }

            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let authResponse = try decoder.decode(AuthResponse.self, from: backendData)

            // Update auth state
            AuthManager.shared.token = authResponse.token
            AuthManager.shared.currentUser = authResponse.user
            AuthManager.shared.isAuthenticated = true

            isLoading = false
            error = nil
        } catch {
            self.error = "Google sign-in failed: \(error.localizedDescription)"
            isLoading = false
        }
    }

    private func exchangeMicrosoftCode(code: String) async {
        do {
            // Exchange code with Microsoft
            let tokenURL = URL(string: "https://login.microsoftonline.com/common/oauth2/v2.0/token")!
            var request = URLRequest(url: tokenURL)
            request.httpMethod = "POST"
            request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")

            let redirectURI = "\(redirectScheme)://oauth/microsoft"

            let body = "code=\(code)&client_id=\(microsoftClientID)&redirect_uri=\(redirectURI)&grant_type=authorization_code&scope=openid%20email%20profile%20User.Read"
            request.httpBody = body.data(using: .utf8)

            let (data, response) = try await URLSession.shared.data(for: request)

            if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode != 200 {
                let responseString = String(data: data, encoding: .utf8) ?? "Unknown error"
                self.error = "Microsoft token error: \(responseString)"
                isLoading = false
                return
            }

            let tokenResponse = try JSONDecoder().decode(MicrosoftTokenResponse.self, from: data)

            // Get user info from Microsoft Graph API
            let userInfoURL = URL(string: "https://graph.microsoft.com/v1.0/me")!
            var userRequest = URLRequest(url: userInfoURL)
            userRequest.setValue("Bearer \(tokenResponse.access_token)", forHTTPHeaderField: "Authorization")

            let (userData, userResponse) = try await URLSession.shared.data(for: userRequest)

            if let httpResponse = userResponse as? HTTPURLResponse, httpResponse.statusCode != 200 {
                let userDataString = String(data: userData, encoding: .utf8) ?? "No data"
                self.error = "Failed to get Microsoft user info: \(userDataString)"
                isLoading = false
                return
            }

            let microsoftUser = try JSONDecoder().decode(MicrosoftUserInfo.self, from: userData)
            let userEmail = microsoftUser.mail ?? microsoftUser.userPrincipalName ?? ""
            let userName = microsoftUser.displayName ?? "User"

            // Send to backend for authentication
            let baseURL = ProcessInfo.processInfo.environment["API_BASE_URL"] ?? "https://servicecrewai.com/api"
            let backendURL = URL(string: "\(baseURL)/mobile-auth")!
            var backendRequest = URLRequest(url: backendURL)
            backendRequest.httpMethod = "POST"
            backendRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")

            let authBody: [String: Any] = [
                "provider": "microsoft",
                "email": userEmail,
                "name": userName,
                "providerId": microsoftUser.id,
                "accessToken": tokenResponse.access_token
            ]
            backendRequest.httpBody = try JSONSerialization.data(withJSONObject: authBody)

            let (backendData, backendResponse) = try await URLSession.shared.data(for: backendRequest)

            if let httpResponse = backendResponse as? HTTPURLResponse, httpResponse.statusCode != 200 {
                let errorString = String(data: backendData, encoding: .utf8) ?? "Unknown error"
                self.error = "Backend error: \(errorString)"
                isLoading = false
                return
            }

            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let authResponse = try decoder.decode(AuthResponse.self, from: backendData)

            // Update auth state
            AuthManager.shared.token = authResponse.token
            AuthManager.shared.currentUser = authResponse.user
            AuthManager.shared.isAuthenticated = true

            isLoading = false
            error = nil
        } catch {
            self.error = "Microsoft sign-in failed: \(error.localizedDescription)"
            isLoading = false
        }
    }
}

// MARK: - Microsoft Response Models
struct MicrosoftTokenResponse: Decodable {
    let access_token: String
    let expires_in: Int
    let token_type: String
    let scope: String?
    let id_token: String?
}

struct MicrosoftUserInfo: Decodable {
    let id: String
    let displayName: String?
    let mail: String?
    let userPrincipalName: String?
    let givenName: String?
    let surname: String?
}

// MARK: - Google Response Models
struct GoogleTokenResponse: Decodable {
    let access_token: String
    let expires_in: Int
    let token_type: String
    let scope: String
    let id_token: String?
}

struct GoogleUserInfo: Decodable {
    let id: String
    let email: String
    let name: String
    let picture: String?
}

// MARK: - Mobile Auth Request
struct MobileAuthRequest: Encodable {
    let provider: String
    let email: String
    let name: String
    let providerId: String
    let accessToken: String
}

// MARK: - ASWebAuthenticationPresentationContextProviding
extension SocialAuthManager: ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene else {
            return ASPresentationAnchor()
        }
        return windowScene.keyWindow ?? ASPresentationAnchor()
    }
}
