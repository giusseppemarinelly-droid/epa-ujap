@AGENTS.md

# Epa

App móvil social exclusiva para la comunidad de la Universidad José Antonio Páez (UJAP), San Diego, Carabobo, Venezuela.

## Qué es (y qué NO es)

**Es** una app para que estudiantes de la UJAP se conozcan y organicen actividades reales: partidos de fútbol, grupos de estudio, salidas a comer, torneos, ensayos de la banda, proyectos, etc. El corazón de la app son los **eventos en el mapa** y los **grupos de interés**.

**NO es** una app de citas. No hay lenguaje romántico, no hay "matches" ni "likes" con connotación de pareja. La interacción de descubrir personas existe, pero es para **encontrar gente con intereses en común y sumarla a planes**, no para ligar. Si en algún momento el código o la copy se acerca al tono de Tinder, corregirlo hacia "comunidad universitaria".

## Marca

- **Nombre:** Epa
- **Tagline:** "El punto de encuentro de la UJAP"
- **Origen del nombre:** "Epa" es el saludo venezolano por excelencia — cálido, informal, cero pretencioso. La app abre la conversación, igual que la palabra.
- **Paleta:** coral/rojo cálido como color primario de acción, morado como acento secundario, superficies blancas/gris muy claro, mucho espacio en blanco
- **Estilo:** tarjetas redondeadas, iconografía outline, tipografía sans limpia, microinteracciones suaves. Referencias: Notion, Linear, apps modernas de finanzas

### Tono de copy

Español venezolano neutro, cercano y juvenil, sin ser vulgar. La app tutea siempre. Frases cortas, verbo primero, sin signos de exclamación en la UI del sistema.

El nombre se puede usar dentro de la copy de forma natural, no forzada:
- "Epa, ¿qué plan tienes hoy?" (estado vacío del mapa)
- "Échale un epa" / "Mándale un epa" como acción de saludar o iniciar conversación con alguien
- "Epas nuevos" para notificaciones de conexiones o saludos recibidos
- Botón de crear evento: "Armar plan", no "Crear evento"
- Botón de unirse: "Me apunto", no "Unirse"

Evitar: "click aquí", "exitosamente", "por favor", jerga corporativa.

## Pantallas (ya diseñadas, replicar la estructura)

1. **Onboarding / Verificación**
   - Verificación obligatoria con correo institucional `@ujap.edu.ve` — solo estudiantes y profesores activos
   - Perfil académico: facultad, carrera, semestre/año (1–5+)
   - Bio corta + intereses seleccionables
   - Selector de "qué buscas en Epa": deportes, estudio, proyectos, amistades, eventos

2. **Mapa de planes** (pantalla principal)
   - Mapa del campus + zonas cercanas de San Diego con pines de planes creados por usuarios
   - Cada pin: título, creador, avatares de quienes van, contador de asistentes, hora
   - Estado "en curso" para planes que ya arrancaron
   - Botón para armar plan nuevo
   - Al abrir un plan: detalle + botón "me apunto" + acceso al chat grupal del plan

3. **Descubrir estudiantes**
   - Tarjetas con foto, nombre, edad, carrera, semestre e intereses
   - Acciones: descartar, destacar, conectar, deshacer
   - Filtros por facultad, carrera, semestre e intereses
   - Insignia de "Verificado UJAP"

4. **Mensajes y grupos**
   - Tabs: Individual / Grupal
   - Chat 1 a 1 y chat grupal por plan y por grupo de interés
   - Buscador de chats y planes

5. **Grupos y actividades**
   - Comunidades por categoría: Académico, Deportes, Tecnología, Creatividad, Arte
   - Grupo destacado en banner (ej. Equipo de Fútbol UJAP)
   - Cada grupo: nombre, categoría, cantidad de miembros, botón "me apunto"
   - CTA para crear grupo propio si no encuentras el tuyo

6. **Perfil**
   - Foto de portada + avatar, nombre, carrera, facultad
   - Insignias: Verificado UJAP, Organizador
   - Estadísticas: planes armados, asistencias
   - Intereses en chips
   - Mis grupos de estudio con contador de mensajes nuevos
   - Editar perfil

Navegación inferior de 5 ítems: Mapa · Descubrir · Grupos · Mensajes · Perfil

## Stack propuesto (confirmar antes de instalar)

- React Native con Expo (SDK reciente) + TypeScript
- Expo Router para navegación
- Supabase: auth con verificación de dominio de correo, Postgres con PostGIS para geolocalización de planes, Realtime para chats, Storage para fotos
- `react-native-maps` para el mapa
- NativeWind o StyleSheet con tokens de diseño centralizados
- Zustand para estado global ligero

## Modelo de datos inicial

- `users`: id, email institucional, nombre, edad, facultad, carrera, semestre, bio, foto, verificado, rol
- `interests` + `user_interests`
- `events`: id, creador, título, descripción, categoría, lat/lng, dirección, fecha/hora, cupo, estado, es_publico
- `event_attendees`: usuario, evento, estado (va / quizás / asistió)
- `groups`: id, nombre, categoría, descripción, imagen, destacado
- `group_members`
- `conversations` (directa / evento / grupo), `messages`
- `connections`: solicitudes entre usuarios y su estado

Nota: en el código las entidades se llaman `events`; en la UI se muestran como "planes".

## Reglas de trabajo

- Antes de escribir código, proponer estructura de carpetas y esperar confirmación
- Empezar por el diseño del sistema de tokens (colores, tipografía, espaciado) y componentes base reutilizables antes de las pantallas
- Cada pantalla como incremento independiente y probable
- Datos mock primero, backend real después
- Comentarios y nombres de variables en inglés, textos de UI en español
- Nada de dependencias pesadas sin justificarlas antes

## Design source (Stitch)

- Proyecto Stitch: "UJAP Campus Connect" (`projects/3632403423750015018`), design system "University Pulse".
- Paleta y tipografía tomadas de ese design system; nombre de marca adaptado de "UJAP Pulse" a "Epa" según las reglas de marca arriba.
- La pantalla "Descubrir" en Stitch usa un ícono de corazón relleno y tono de swipe estilo Tinder para la acción "conectar" — se reemplaza por un ícono neutral y copy de comunidad, no de citas.
