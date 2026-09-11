import type { Faculty } from '@/src/types';

// Carreras de pregrado reales de la UJAP por facultad (ujap.edu.ve/facultades/,
// verificado en las páginas de cada facultad: salud.ujap.edu.ve,
// juriticas.ujap.edu.ve). Se actualiza a mano si la universidad abre o
// cierra una carrera.
export const CAREERS_BY_FACULTY: Record<Faculty, string[]> = {
  Ingeniería: [
    'Arquitectura',
    'Ingeniería Civil',
    'Ingeniería de Computación',
    'Ingeniería Electrónica',
    'Ingeniería Industrial',
    'Ingeniería Mecánica',
    'Ingeniería de Telecomunicaciones',
  ],
  'Ciencias Jurídicas y Políticas': ['Derecho'],
  'Ciencias Económicas y Sociales': [
    'Administración de Empresas',
    'Administración Pública',
    'Contaduría Pública',
    'Mercadeo',
    'Relaciones Industriales',
  ],
  'Ciencias de la Salud': ['Odontología'],
};

export const FACULTIES = Object.keys(CAREERS_BY_FACULTY) as Faculty[];

export const SEMESTER_OPTIONS = Array.from({ length: 10 }, (_, index) => index + 1);
