import { Redirect } from 'expo-router';

import { useAuthStore } from '@/src/store';

export default function Index() {
  const status = useAuthStore((state) => state.status);

  return <Redirect href={status === 'signed-in' ? '/(tabs)/mapa' : '/onboarding'} />;
}
