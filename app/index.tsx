import { Redirect } from 'expo-router';

import { useAuthStore } from '@/src/store';

export default function Index() {
  const status = useAuthStore((state) => state.status);

  // Sin sesión se entra por el login, no por el registro: la mayoría de las
  // veces que se abre la app ya se tiene cuenta. Desde el login hay enlace
  // a /onboarding para quien todavía no la tiene.
  return <Redirect href={status === 'signed-in' ? '/(tabs)/mapa' : '/login'} />;
}
