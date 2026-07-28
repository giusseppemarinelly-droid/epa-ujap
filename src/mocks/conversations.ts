import type { Conversation, Message } from '@/src/types';

export const conversations: Conversation[] = [
  {
    id: 'c-valeria',
    type: 'directa',
    title: 'Valeria Méndez',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80',
    participantIds: ['u-alejandro', 'u-valeria'],
    unreadCount: 2,
  },
  {
    id: 'c-daniel',
    type: 'directa',
    title: 'Daniel Castillo',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    participantIds: ['u-alejandro', 'u-daniel'],
    unreadCount: 0,
  },
  {
    id: 'c-camila',
    type: 'directa',
    title: 'Camila Rojas',
    avatarUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&q=80',
    participantIds: ['u-alejandro', 'u-camila'],
    unreadCount: 0,
  },
  {
    id: 'c-calculo',
    type: 'plan',
    title: 'Estudio Cálculo II',
    participantIds: ['u-mateo', 'u-daniel', 'u-alejandro'],
    unreadCount: 3,
  },
  {
    id: 'c-robotica',
    type: 'grupo',
    title: 'Club de Robótica',
    participantIds: ['u-daniel'],
    unreadCount: 0,
  },
];

export const messages: Message[] = [
  {
    id: 'm-1',
    conversationId: 'c-valeria',
    senderId: 'u-valeria',
    text: '¡Claro! Nos vemos en el audit...',
    sentAt: '2026-07-28T10:42:00-04:00',
  },
  {
    id: 'm-2',
    conversationId: 'c-daniel',
    senderId: 'u-daniel',
    text: '¿Ya terminaste el proyecto de IA?',
    sentAt: '2026-07-27T09:00:00-04:00',
  },
  {
    id: 'm-3',
    conversationId: 'c-camila',
    senderId: 'u-camila',
    text: 'El evento de diseño estuvo ge...',
    sentAt: '2026-07-25T18:00:00-04:00',
  },
];
