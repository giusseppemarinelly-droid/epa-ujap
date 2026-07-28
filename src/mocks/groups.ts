import type { Group } from '@/src/types';

export const groups: Group[] = [
  {
    id: 'g-futbol',
    name: 'Equipo de Fútbol UJAP',
    category: 'Deportes',
    description: 'El equipo oficial de la universidad. Entrenamos martes y jueves.',
    imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1200&q=80',
    memberIds: ['u-alejandro', 'u-mateo'],
    featured: true,
  },
  {
    id: 'g-robotica',
    name: 'Club de Robótica',
    category: 'Tecnología',
    description: 'Construimos robots para competencias interuniversitarias.',
    memberIds: ['u-daniel'],
    featured: false,
  },
  {
    id: 'g-parciales',
    name: 'Estudio para Parciales',
    category: 'Académico',
    description: 'Grupo abierto de repaso para todas las carreras.',
    memberIds: ['u-mateo', 'u-daniel', 'u-alejandro'],
    featured: false,
  },
  {
    id: 'g-uxui',
    name: 'Diseño UX/UI UJAP',
    category: 'Creatividad',
    description: 'Compartimos proyectos y feedback de diseño.',
    memberIds: ['u-camila'],
    featured: false,
  },
  {
    id: 'g-banda',
    name: 'Banda Universitaria',
    category: 'Arte',
    description: 'Ensayos semanales, todos los instrumentos son bienvenidos.',
    memberIds: ['u-valeria'],
    featured: false,
  },
];
