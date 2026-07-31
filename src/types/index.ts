export type Faculty =
  | 'Ingeniería'
  | 'Ciencias Jurídicas y Políticas'
  | 'Ciencias Económicas y Sociales'
  | 'Ciencias de la Salud';

export type LookingFor = 'deportes' | 'estudio' | 'proyectos' | 'amistades' | 'eventos';

export type Interest = {
  id: string;
  label: string;
};

export type User = {
  id: string;
  email: string;
  name: string;
  age: number;
  faculty: Faculty;
  career: string;
  semester: number;
  bio: string;
  photoUrl?: string;
  photos: string[];
  verified: boolean;
  isOrganizer: boolean;
  interestIds: string[];
  lookingFor: LookingFor[];
  online: boolean;
  mutualConnections: PersonSummary[];
  stats: {
    plansCreated: number;
    attendances: number;
  };
};

export type PlanCategory = 'deportes' | 'estudio' | 'comida' | 'proyectos' | 'cultura';

export type PlanStatus = 'programado' | 'en_curso' | 'finalizado';

export type PersonSummary = {
  id: string;
  name: string;
  photoUrl?: string;
  online: boolean;
};

export type Plan = {
  id: string;
  creatorId: string;
  creator?: PersonSummary;
  title: string;
  description: string;
  category: PlanCategory;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  dateTime: string;
  capacity: number;
  status: PlanStatus;
  isPublic: boolean;
  attendeeIds: string[];
  attendees?: PersonSummary[];
};

export type GroupCategory = 'Académico' | 'Deportes' | 'Tecnología' | 'Creatividad' | 'Arte';

export type Group = {
  id: string;
  name: string;
  category: GroupCategory;
  description: string;
  imageUrl?: string;
  memberIds: string[];
  members?: PersonSummary[];
  featured: boolean;
  conversationId?: string;
};

export type ConversationType = 'directa' | 'plan' | 'grupo';

export type Conversation = {
  id: string;
  type: ConversationType;
  title: string;
  avatarUrl?: string;
  online?: boolean;
  participantIds: string[];
  unreadCount: number;
  lastMessageText?: string;
  lastMessageAt?: string;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  sentAt: string;
};
