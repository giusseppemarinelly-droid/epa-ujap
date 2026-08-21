import { prisma } from '../../lib/prisma';

// Una posición caduca a la media hora. Si alguien cerró la app anoche, su
// último punto no puede seguir clavado en el mapa como si estuviera ahí: se
// deja de mostrar solo, sin que nadie tenga que apagar nada.
const LOCATION_TTL_MS = 30 * 60 * 1000;

// Lo único que sale al mapa. Nada de correo, bio ni fotos extra: quien mira
// el mapa solo necesita reconocer a la persona y saber dónde está.
const MAP_PERSON_SELECT = {
  id: true,
  name: true,
  photoUrl: true,
  career: true,
  lastLat: true,
  lastLng: true,
  locationUpdatedAt: true,
} as const;

export type VisiblePerson = {
  id: string;
  name: string;
  photoUrl: string | null;
  career: string | null;
  lastLat: number;
  lastLng: number;
  locationUpdatedAt: Date;
};

export async function updateMyLocation(userId: string, lat: number, lng: number) {
  // El opt-in se comprueba dentro del propio update: así no hay ventana entre
  // "leo el flag" y "escribo la posición" en la que alguien acabe de apagar
  // el interruptor y su ubicación se guarde igual.
  const { count } = await prisma.user.updateMany({
    where: { id: userId, shareLocation: true },
    data: { lastLat: lat, lastLng: lng, locationUpdatedAt: new Date() },
  });
  return count > 0;
}

export async function setSharing(userId: string, shareLocation: boolean) {
  return prisma.user.update({
    where: { id: userId },
    data: shareLocation
      ? { shareLocation: true }
      : // Apagar borra el rastro, no lo esconde: si vuelves a encenderlo,
        // apareces donde estés ahora, no donde estabas la última vez.
        { shareLocation: false, lastLat: null, lastLng: null, locationUpdatedAt: null },
  });
}

export async function listVisiblePeople(userId: string): Promise<VisiblePerson[]> {
  const freshSince = new Date(Date.now() - LOCATION_TTL_MS);

  const people = await prisma.user.findMany({
    where: {
      id: { not: userId },
      verified: true,
      shareLocation: true,
      lastLat: { not: null },
      lastLng: { not: null },
      locationUpdatedAt: { gte: freshSince },
    },
    select: MAP_PERSON_SELECT,
  });

  // El filtro de arriba ya descarta los nulos, pero Prisma no lo refleja en
  // el tipo; este narrowing lo deja explícito para el resto del flujo.
  return people.filter(
    (person): person is VisiblePerson =>
      person.lastLat !== null && person.lastLng !== null && person.locationUpdatedAt !== null
  );
}
