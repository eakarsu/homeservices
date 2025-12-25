import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../providers/auth_provider.dart';
import '../screens/auth/login_screen.dart';
import '../screens/home/main_screen.dart';
import '../screens/jobs/job_detail_screen.dart';
import '../screens/jobs/jobs_list_screen.dart';

class AppRouter {
  static GoRouter router(AuthProvider authProvider) {
    return GoRouter(
      initialLocation: '/',
      refreshListenable: authProvider,
      redirect: (context, state) {
        final isAuthenticated = authProvider.isAuthenticated;
        final isLoading = authProvider.status == AuthStatus.initial ||
            authProvider.status == AuthStatus.loading;

        // Show loading while checking auth
        if (isLoading) {
          return null;
        }

        final isLoginPage = state.matchedLocation == '/login';

        // If not authenticated and not on login page, redirect to login
        if (!isAuthenticated && !isLoginPage) {
          return '/login';
        }

        // If authenticated and on login page, redirect to home
        if (isAuthenticated && isLoginPage) {
          return '/';
        }

        return null;
      },
      routes: [
        GoRoute(
          path: '/login',
          name: 'login',
          builder: (context, state) => const LoginScreen(),
        ),
        ShellRoute(
          builder: (context, state, child) => MainScreen(child: child),
          routes: [
            GoRoute(
              path: '/',
              name: 'home',
              builder: (context, state) => const HomeTab(),
            ),
            GoRoute(
              path: '/jobs',
              name: 'jobs',
              builder: (context, state) => const JobsListScreen(),
              routes: [
                GoRoute(
                  path: ':id',
                  name: 'job-detail',
                  builder: (context, state) {
                    final jobId = state.pathParameters['id']!;
                    return JobDetailScreen(jobId: jobId);
                  },
                ),
              ],
            ),
            GoRoute(
              path: '/schedule',
              name: 'schedule',
              builder: (context, state) => const ScheduleTab(),
            ),
            GoRoute(
              path: '/inventory',
              name: 'inventory',
              builder: (context, state) => const InventoryTab(),
            ),
            GoRoute(
              path: '/profile',
              name: 'profile',
              builder: (context, state) => const ProfileTab(),
            ),
          ],
        ),
      ],
      errorBuilder: (context, state) => Scaffold(
        body: Center(
          child: Text('Page not found: ${state.uri}'),
        ),
      ),
    );
  }
}

// Placeholder tab widgets - these would be replaced with actual implementations
class HomeTab extends StatelessWidget {
  const HomeTab({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('Home'));
  }
}

class ScheduleTab extends StatelessWidget {
  const ScheduleTab({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('Schedule'));
  }
}

class InventoryTab extends StatelessWidget {
  const InventoryTab({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('Inventory'));
  }
}

class ProfileTab extends StatelessWidget {
  const ProfileTab({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('Profile'));
  }
}
