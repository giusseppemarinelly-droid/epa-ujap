import 'dotenv/config';

import bcrypt from 'bcryptjs';

import { prisma } from '../src/lib/prisma';

const INTERESTS = [
  'Música',
  'Programación',
  'Café',
  'Gym',
  'Fútbol',
  'Basket',
  'Lectura',
  'Diseño',
  'Robótica',
  'Fotografía',
  'Videojuegos',
  'Banda',
];

async function main() {
  console.log('Sembrando intereses...');
  const interestByLabel = new Map<string, string>();
  for (const label of INTERESTS) {
    const interest = await prisma.interest.upsert({
      where: { label },
      update: {},
      create: { label },
    });
    interestByLabel.set(label, interest.id);
  }

  const passwordHash = await bcrypt.hash('Epa12345!', 10);

  console.log('Sembrando usuarios de prueba...');
  const alejandro = await prisma.user.upsert({
    where: { email: 'alejandro.martinez@ujap.edu.ve' },
    update: {},
    create: {
      email: 'alejandro.martinez@ujap.edu.ve',
      passwordHash,
      name: 'Alejandro Martínez',
      age: 22,
      faculty: 'INGENIERIA',
      career: 'Ingeniería en Computación',
      semester: 7,
      bio: 'Armando planes de estudio y proyectos de IA. Échame un epa si te gusta el café.',
      verified: true,
      isOrganizer: true,
      lookingFor: ['PROYECTOS', 'ESTUDIO'],
      interests: {
        create: ['Música', 'Programación', 'Café', 'Gym'].map((label) => ({
          interestId: interestByLabel.get(label)!,
        })),
      },
    },
  });

  const mateo = await prisma.user.upsert({
    where: { email: 'mateo.gonzalez@ujap.edu.ve' },
    update: {},
    create: {
      email: 'mateo.gonzalez@ujap.edu.ve',
      passwordHash,
      name: 'Mateo G.',
      age: 23,
      faculty: 'INGENIERIA',
      career: 'Ingeniería Civil',
      semester: 8,
      bio: 'Organizo el grupo de estudio de Cálculo. Siempre hay sitio para uno más.',
      verified: true,
      isOrganizer: true,
      lookingFor: ['ESTUDIO', 'PROYECTOS'],
      interests: {
        create: ['Programación', 'Fútbol'].map((label) => ({ interestId: interestByLabel.get(label)! })),
      },
    },
  });

  const valentina = await prisma.user.upsert({
    where: { email: 'valentina.rodriguez@ujap.edu.ve' },
    update: {},
    create: {
      email: 'valentina.rodriguez@ujap.edu.ve',
      passwordHash,
      name: 'Valentina',
      age: 21,
      faculty: 'INGENIERIA',
      career: 'Ingeniería Industrial',
      semester: 6,
      bio: 'Tercer año, amante del café y del tenis.',
      verified: true,
      lookingFor: ['AMISTADES', 'ESTUDIO'],
      interests: {
        create: ['Música', 'Café', 'Lectura'].map((label) => ({ interestId: interestByLabel.get(label)! })),
      },
    },
  });

  console.log('Sembrando planes de prueba...');
  await prisma.plan.upsert({
    where: { id: 'seed-plan-calculo' },
    update: {},
    create: {
      id: 'seed-plan-calculo',
      creatorId: mateo.id,
      title: 'Estudio Cálculo II',
      description: 'Repaso de límites y derivadas antes del parcial. Trae tu calculadora.',
      category: 'ESTUDIO',
      latitude: 10.2167,
      longitude: -68.0092,
      address: 'Cafetería El Samán',
      dateTime: new Date(),
      capacity: 10,
      status: 'EN_CURSO',
      attendees: {
        create: [{ userId: mateo.id }, { userId: alejandro.id }],
      },
    },
  });

  await prisma.plan.upsert({
    where: { id: 'seed-plan-futbol' },
    update: {},
    create: {
      id: 'seed-plan-futbol',
      creatorId: alejandro.id,
      title: 'Partido de fútbol 5v5',
      description: 'Armamos equipos en la cancha de la facultad de Ingeniería.',
      category: 'DEPORTES',
      latitude: 10.2178,
      longitude: -68.0105,
      address: 'Cancha de Ingeniería',
      dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      capacity: 10,
      attendees: {
        create: [{ userId: alejandro.id }, { userId: mateo.id }],
      },
    },
  });

  console.log('Sembrando grupos de prueba...');
  await prisma.group.upsert({
    where: { id: 'seed-group-futbol' },
    update: {},
    create: {
      id: 'seed-group-futbol',
      creatorId: alejandro.id,
      name: 'Equipo de Fútbol UJAP',
      category: 'DEPORTES',
      description: 'El equipo oficial de la universidad. Entrenamos martes y jueves.',
      featured: true,
      members: { create: [{ userId: alejandro.id }, { userId: mateo.id }] },
    },
  });

  await prisma.group.upsert({
    where: { id: 'seed-group-parciales' },
    update: {},
    create: {
      id: 'seed-group-parciales',
      creatorId: mateo.id,
      name: 'Estudio para Parciales',
      category: 'ACADEMICO',
      description: 'Grupo abierto de repaso para todas las carreras.',
      members: { create: [{ userId: mateo.id }, { userId: alejandro.id }] },
    },
  });

  console.log('Sembrando conversación directa de prueba...');
  const existingConversation = await prisma.conversation.findFirst({
    where: {
      type: 'DIRECTA',
      AND: [
        { participants: { some: { userId: alejandro.id } } },
        { participants: { some: { userId: valentina.id } } },
      ],
    },
  });

  if (!existingConversation) {
    await prisma.conversation.create({
      data: {
        type: 'DIRECTA',
        participants: { create: [{ userId: alejandro.id }, { userId: valentina.id }] },
      },
    });
  }

  console.log('Listo. Usuarios de prueba con contraseña: Epa12345!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
