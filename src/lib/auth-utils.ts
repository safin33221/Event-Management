import { UserRole } from '@/types/event-management';

export function getDefaultDashboard(role?: UserRole): string {
  switch (role) {
    case 'STAFF':
      return '/staff';
    case 'OWNER':
    case 'COORDINATOR':
    case 'ACCOUNTANT':
    default:
      return '/admin';
  }
}
