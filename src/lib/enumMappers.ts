import type {
  Conversation,
  ConversationType,
  Faculty,
  Group,
  GroupCategory,
  LookingFor,
  Message,
  Plan,
  PlanCategory,
  PlanStatus,
  User,
} from '@/src/types';

export const facultyToBackend: Record<Faculty, string> = {
  Ingeniería: 'INGENIERIA',
  'Ciencias Jurídicas y Políticas': 'CIENCIAS_JURIDICAS_POLITICAS',
  'Ciencias Económicas y Sociales': 'CIENCIAS_ECONOMICAS_SOCIALES',
  'Ciencias de la Salud': 'CIENCIAS_DE_LA_SALUD',
};

export const facultyFromBackend: Record<string, Faculty> = Object.fromEntries(
  Object.entries(facultyToBackend).map(([label, value]) => [value, label as Faculty])
);

export const lookingForToBackend: Record<LookingFor, string> = {
  deportes: 'DEPORTES',
  estudio: 'ESTUDIO',
  proyectos: 'PROYECTOS',
  amistades: 'AMISTADES',
  eventos: 'EVENTOS',
};

export const lookingForFromBackend: Record<string, LookingFor> = Object.fromEntries(
  Object.entries(lookingForToBackend).map(([label, value]) => [value, label as LookingFor])
);

export const planCategoryToBackend: Record<PlanCategory, string> = {
  deportes: 'DEPORTES',
  estudio: 'ESTUDIO',
  comida: 'COMIDA',
  proyectos: 'PROYECTOS',
  cultura: 'CULTURA',
};

export const planCategoryFromBackend: Record<string, PlanCategory> = Object.fromEntries(
  Object.entries(planCategoryToBackend).map(([label, value]) => [value, label as PlanCategory])
);

export const planStatusToBackend: Record<PlanStatus, string> = {
  programado: 'PROGRAMADO',
  en_curso: 'EN_CURSO',
  finalizado: 'FINALIZADO',
};

export const planStatusFromBackend: Record<string, PlanStatus> = Object.fromEntries(
  Object.entries(planStatusToBackend).map(([label, value]) => [value, label as PlanStatus])
);

export const groupCategoryToBackend: Record<GroupCategory, string> = {
  Académico: 'ACADEMICO',
  Deportes: 'DEPORTES',
  Tecnología: 'TECNOLOGIA',
  Creatividad: 'CREATIVIDAD',
  Arte: 'ARTE',
};

export const groupCategoryFromBackend: Record<string, GroupCategory> = Object.fromEntries(
  Object.entries(groupCategoryToBackend).map(([label, value]) => [value, label as GroupCategory])
);

export type BackendUser = {
  id: string;
  email: string;
  name: string;
  age: number | null;
  faculty: string | null;
  career: string | null;
  semester: number | null;
  bio: string | null;
  photoUrl: string | null;
  photos: string[];
  verified: boolean;
  isOrganizer: boolean;
  lookingFor: string[];
  online: boolean;
  mutualConnections?: { id: string; name: string; photoUrl: string | null }[];
  interests?: { interest: { id: string; label: string } }[];
  stats?: { plansCreated: number; attendances: number };
};

export function mapUserFromBackend(raw: BackendUser): User {
  return {
    id: raw.id,
    email: raw.email,
    name: raw.name,
    age: raw.age ?? 0,
    faculty: raw.faculty ? (facultyFromBackend[raw.faculty] ?? 'Ingeniería') : 'Ingeniería',
    career: raw.career ?? '',
    semester: raw.semester ?? 1,
    bio: raw.bio ?? '',
    photoUrl: raw.photoUrl ?? undefined,
    photos: raw.photos.length > 0 ? raw.photos : raw.photoUrl ? [raw.photoUrl] : [],
    verified: raw.verified,
    isOrganizer: raw.isOrganizer,
    interestIds: raw.interests?.map((entry) => entry.interest.id) ?? [],
    lookingFor: raw.lookingFor.map((value) => lookingForFromBackend[value]).filter(Boolean),
    online: raw.online,
    mutualConnections: (raw.mutualConnections ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      photoUrl: m.photoUrl ?? undefined,
      online: false,
    })),
    stats: raw.stats ?? { plansCreated: 0, attendances: 0 },
  };
}

type BackendPersonSummary = { id: string; name: string; photoUrl: string | null; online: boolean };

export type BackendPlan = {
  id: string;
  creatorId: string;
  creator: BackendPersonSummary;
  title: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  address: string;
  dateTime: string;
  capacity: number;
  status: string;
  isPublic: boolean;
  attendees: { userId: string; user: BackendPersonSummary }[];
};

function mapPersonSummary(raw: BackendPersonSummary) {
  return { id: raw.id, name: raw.name, photoUrl: raw.photoUrl ?? undefined, online: raw.online };
}

export function mapPlanFromBackend(raw: BackendPlan): Plan {
  return {
    id: raw.id,
    creatorId: raw.creatorId,
    creator: mapPersonSummary(raw.creator),
    title: raw.title,
    description: raw.description,
    category: planCategoryFromBackend[raw.category] ?? 'estudio',
    location: { lat: raw.latitude, lng: raw.longitude, address: raw.address },
    dateTime: raw.dateTime,
    capacity: raw.capacity,
    status: planStatusFromBackend[raw.status] ?? 'programado',
    isPublic: raw.isPublic,
    attendeeIds: raw.attendees.map((attendee) => attendee.userId),
    attendees: raw.attendees.map((attendee) => mapPersonSummary(attendee.user)),
  };
}

export type BackendGroup = {
  id: string;
  name: string;
  category: string;
  description: string;
  imageUrl: string | null;
  featured: boolean;
  members: { userId: string; user: BackendPersonSummary }[];
  conversation: { id: string } | null;
};

export function mapGroupFromBackend(raw: BackendGroup): Group {
  return {
    id: raw.id,
    name: raw.name,
    category: groupCategoryFromBackend[raw.category] ?? 'Académico',
    description: raw.description,
    imageUrl: raw.imageUrl ?? undefined,
    memberIds: raw.members.map((member) => member.userId),
    members: raw.members.map((member) => mapPersonSummary(member.user)),
    featured: raw.featured,
    conversationId: raw.conversation?.id,
  };
}

const conversationTypeFromBackend: Record<string, ConversationType> = {
  DIRECTA: 'directa',
  PLAN: 'plan',
  GRUPO: 'grupo',
};

export type BackendConversation = {
  id: string;
  type: string;
  title: string | null;
  unreadCount: number;
  participants: { userId: string; user: BackendPersonSummary }[];
  lastMessage: { id: string; text: string; sentAt: string; senderId: string } | null;
};

export function mapConversationFromBackend(raw: BackendConversation, currentUserId: string): Conversation {
  const type = conversationTypeFromBackend[raw.type] ?? 'directa';
  const otherParticipant = raw.participants.find((participant) => participant.userId !== currentUserId);
  const title = raw.title ?? (type === 'directa' ? (otherParticipant?.user.name ?? 'Conversación') : 'Grupo');
  const avatarUrl = type === 'directa' ? (otherParticipant?.user.photoUrl ?? undefined) : undefined;
  const online = type === 'directa' ? otherParticipant?.user.online : undefined;

  return {
    id: raw.id,
    type,
    title,
    avatarUrl,
    online,
    participantIds: raw.participants.map((participant) => participant.userId),
    unreadCount: raw.unreadCount,
    lastMessageText: raw.lastMessage?.text,
    lastMessageAt: raw.lastMessage?.sentAt,
  };
}

export type BackendMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  sentAt: string;
  sender: BackendPersonSummary;
};

export function mapMessageFromBackend(raw: BackendMessage): Message {
  return {
    id: raw.id,
    conversationId: raw.conversationId,
    senderId: raw.senderId,
    text: raw.text,
    sentAt: raw.sentAt,
  };
}
