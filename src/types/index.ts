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
  verified: boolean;
  isOrganizer: boolean;
  interestIds: string[];
  lookingFor: LookingFor[];
  stats: {
    plansCreated: number;
    attendances: number;
  };
};

export type PlanCategory = 'deportes' | 'estudio' | 'comida' | 'proyectos' | 'cultura';

export type PlanStatus = 'programado' | 'en_curso' | 'finalizado';

export type Plan = {
  id: string;
  creatorId: string;
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
};

export type GroupCategory = 'Académico' | 'Deportes' | 'Tecnología' | 'Creatividad' | 'Arte';

export type Group = {
  id: string;
  name: string;
  category: GroupCategory;
  description: string;
  imageUrl?: string;
  memberIds: string[];
  featured: boolean;
};

export type ConversationType = 'directa' | 'plan' | 'grupo';

export type Conversation = {
  id: string;
  type: ConversationType;
  title: string;
  avatarUrl?: string;
  participantIds: string[];
  unreadCount: number;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  sentAt: string;
};
