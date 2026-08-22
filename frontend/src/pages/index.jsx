import { useEffect } from 'react';
import { useRouter } from 'next/router';
import useAuthStore from '../store/authStore';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    } else if (user?.role) {
      const dashboardMap = {
        farmer: '/dashboard/farmer',
        trader: '/dashboard/trader',
        agent: '/dashboard/agent',
        admin: '/dashboard/admin',
      };
      const target = dashboardMap[user.role];
      if (target) {
        router.replace(target);
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, user, router]);

  return null; // or a simple loading indicator
}