import { Redirect } from 'expo-router';

import { useAuthStore } from '@/src/store';

export default function Index() {
  const isVerified = useAuthStore((state) => state.isVerified);

  return <Redirect href={isVerified ? '/(tabs)/mapa' : '/onboarding'} />;
}
