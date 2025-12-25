import Foundation
import CoreLocation
import Combine

// MARK: - Location Manager

class LocationManager: NSObject, ObservableObject {
    static let shared = LocationManager()

    private let locationManager = CLLocationManager()

    @Published var location: CLLocation?
    @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined
    @Published var isUpdatingLocation = false
    @Published var error: String?

    private var updateTimer: Timer?
    private let updateInterval: TimeInterval = 60 // Update every 60 seconds

    override private init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.distanceFilter = 50 // Update when moved 50 meters
        locationManager.allowsBackgroundLocationUpdates = false
        locationManager.pausesLocationUpdatesAutomatically = true

        authorizationStatus = locationManager.authorizationStatus
    }

    // MARK: - Authorization

    func requestPermission() {
        locationManager.requestWhenInUseAuthorization()
    }

    func requestAlwaysPermission() {
        locationManager.requestAlwaysAuthorization()
    }

    // MARK: - Location Updates

    func startUpdatingLocation() {
        guard authorizationStatus == .authorizedWhenInUse || authorizationStatus == .authorizedAlways else {
            requestPermission()
            return
        }

        isUpdatingLocation = true
        locationManager.startUpdatingLocation()

        // Start periodic server updates
        startPeriodicUpdates()
    }

    func stopUpdatingLocation() {
        isUpdatingLocation = false
        locationManager.stopUpdatingLocation()
        stopPeriodicUpdates()
    }

    // MARK: - Get Current Location

    func getCurrentLocation() async -> CLLocation? {
        // Check authorization
        guard authorizationStatus == .authorizedWhenInUse || authorizationStatus == .authorizedAlways else {
            return nil
        }

        // Return cached location if recent
        if let location = location, Date().timeIntervalSince(location.timestamp) < 30 {
            return location
        }

        // Request new location
        locationManager.requestLocation()

        // Wait for location update
        for await newLocation in locationUpdates() {
            return newLocation
        }

        return nil
    }

    private func locationUpdates() -> AsyncStream<CLLocation> {
        AsyncStream { continuation in
            let cancellable = $location
                .compactMap { $0 }
                .first()
                .sink { location in
                    continuation.yield(location)
                    continuation.finish()
                }

            continuation.onTermination = { _ in
                cancellable.cancel()
            }
        }
    }

    // MARK: - Server Updates

    private func startPeriodicUpdates() {
        stopPeriodicUpdates()

        updateTimer = Timer.scheduledTimer(withTimeInterval: updateInterval, repeats: true) { [weak self] _ in
            Task {
                await self?.sendLocationToServer()
            }
        }

        // Send initial update
        Task {
            await sendLocationToServer()
        }
    }

    private func stopPeriodicUpdates() {
        updateTimer?.invalidate()
        updateTimer = nil
    }

    private func sendLocationToServer() async {
        guard let location = location else { return }

        do {
            _ = try await APIService.shared.updateLocation(
                latitude: location.coordinate.latitude,
                longitude: location.coordinate.longitude
            )
        } catch {
            print("Failed to update location on server: \(error)")
        }
    }

    // MARK: - Helpers

    var hasLocationPermission: Bool {
        authorizationStatus == .authorizedWhenInUse || authorizationStatus == .authorizedAlways
    }

    var latitude: Double? {
        location?.coordinate.latitude
    }

    var longitude: Double? {
        location?.coordinate.longitude
    }

    var coordinateString: String {
        guard let location = location else { return "Unknown" }
        return String(format: "%.6f, %.6f", location.coordinate.latitude, location.coordinate.longitude)
    }
}

// MARK: - CLLocationManagerDelegate

extension LocationManager: CLLocationManagerDelegate {
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let newLocation = locations.last else { return }
        location = newLocation
        error = nil
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("Location error: \(error.localizedDescription)")
        self.error = error.localizedDescription
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        authorizationStatus = manager.authorizationStatus

        switch authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways:
            if isUpdatingLocation {
                locationManager.startUpdatingLocation()
            }
        case .denied, .restricted:
            isUpdatingLocation = false
            error = "Location access denied. Please enable in Settings."
        default:
            break
        }
    }
}
