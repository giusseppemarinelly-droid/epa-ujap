# Epa

**El punto de encuentro de la UJAP.**

App móvil social exclusiva para la comunidad de la Universidad José Antonio Páez (San Diego, Carabobo, Venezuela).

Epa sirve para que estudiantes y profesores se consigan y armen planes reales: partidos de fútbol, grupos de estudio, salidas a comer, torneos, ensayos de la banda, proyectos. El corazón de la app son los **planes en el mapa** y los **grupos de interés**.

El acceso es cerrado: la cuenta se verifica con el correo institucional `@ujap.edu.ve`.

> **No es una app de citas.** La pantalla de Descubrir existe para encontrar gente con intereses en común y sumarla a planes, no para ligar. Si algo en el código o en la copy se acerca al tono de Tinder, es un bug.

---

## Qué hace

| Pantalla | Qué resuelve |
| --- | --- |
| **Mapa** | Planes del campus con sus pines, quién va y a qué hora. Y personas en el mapa, si activaron su ubicación |
| **Descubrir** | Tarjetas deslizables de estudiantes, con filtros por facultad, carrera, semestre e intereses |
| **Grupos** | Comunidades por categoría: Académico, Deportes, Tecnología, Creatividad, Arte |
| **Mensajes** | Chats 1 a 1 y grupales, con fotos, videos, Snaps que se ven una sola vez, y rachas |
| **Perfil** | Portada y galería personalizables, insignias, estadísticas, intereses y tema claro/oscuro |

Además: solicitudes de conexión ("epas"), bandeja de notificaciones, y modo oscuro completo.

### Detalles que vale la pena conocer

**Snaps efímeros.** Lo que mandas desde la cámara se ve **una sola vez** y se destruye. Lo que mandas desde la galería se queda en el chat. La URL del archivo nunca viaja en la lista de mensajes: el servidor la entrega solo al abrirlo, y borra el archivo de Storage cuando ya lo vieron todos. Sin eso, esconder la foto sería puro teatro.

**Ubicación opt-in.** Aparecer en el mapa está **apagado por defecto**. La posición caduca a los 30 minutos sin actualizarse, y apagar el interruptor borra las coordenadas guardadas en vez de solo esconderlas. Las coordenadas nunca salen por los endpoints normales de usuario — solo por el del mapa, y solo de quien las activó.

**Rachas.** Días seguidos en que dos personas se intercambian fotos. Solo en chats directos. Se rompen a las 48 horas.

**Sesión.** Se mantiene abierta mientras uses la app y se cierra sola tras un mes sin entrar. El token se renueva en cada arranque, así que el mes cuenta desde la última vez que abriste, no desde que iniciaste sesión.

---

## Stack

### App

| Pieza | Tecnología |
| --- | --- |
| Framework | React Native 0.81 + Expo SDK 54 |
| Lenguaje | TypeScript (`strict`) |
| Navegación | Expo Router (rutas por archivos) |
| Estilos | NativeWind (Tailwind para React Native) + tokens propios |
| Estado global | Zustand (9 stores) |
| Mapas | `react-native-maps` en móvil, `react-leaflet` en web |
| Gestos y animación | Gesture Handler + Reanimated |
| Media | `expo-image-picker`, `expo-video`, `expo-location` |

### Backend

| Pieza | Tecnología |
| --- | --- |
| Servidor | Express 4 sobre Node 20 |
| ORM | Prisma 6 |
| Base de datos | PostgreSQL (Supabase) |
| Validación | zod |
| Auth | JWT + bcrypt |
| Archivos | Supabase Storage |

---

## Cómo correrlo

### 1. La app

```bash
npm install
cp .env.example .env      # en Windows: copy .env.example .env
npm run web               # abre en el navegador
npm start                 # o escanea el QR con Expo Go
```

El único ajuste es `EXPO_PUBLIC_API_URL` en el `.env`. Apunta al backend desplegado por defecto.

> **En el teléfono, `localhost` no sirve.** Si corres el backend en tu máquina y pruebas con Expo Go, `localhost` apunta al propio teléfono. Usa la IP de tu PC en la red: `http://192.168.1.X:4000`.

### 2. El backend

```bash
cd backend
npm install
cp .env.example .env      # y llena DATABASE_URL y JWT_SECRET
npx prisma generate
npm run dev               # queda escuchando en el puerto 4000
```

Para llenar la base con datos de prueba:

```bash
npm run prisma:seed       # 12 intereses y usuarios con clave Epa12345!
```

---

## Variables de entorno

**Raíz** (`.env`)

| Variable | Para qué |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | URL del backend. Obligatoria en móvil; en web puede ir vacía si se sirve desde el mismo origen |

**Backend** (`backend/.env`)

| Variable | Para qué |
| --- | --- |
| `DATABASE_URL` | Postgres de Supabase. Usa el *transaction pooler* (puerto 6543, con `?pgbouncer=true`) |
| `JWT_SECRET` | Secreto para firmar los tokens. Mínimo 16 caracteres |
| `PORT` | Por defecto 4000 |
| `ALLOWED_EMAIL_DOMAIN` | `ujap.edu.ve` |
| `SUPABASE_URL` | Para subir fotos y videos a Storage |
| `SUPABASE_SERVICE_ROLE_KEY` | Idem. **Nunca la expongas en el cliente** |

---

## Estructura

```
app/                       Rutas (Expo Router: cada archivo es una pantalla)
├── _layout.tsx            Layout raíz: fuentes, sesión, tema, splash
├── index.tsx              Redirige según haya sesión o no
├── onboarding.tsx         Registro con verificación de correo UJAP
├── login.tsx              Inicio de sesión
├── (tabs)/                Las 5 pestañas: mapa, descubrir, grupos, mensajes, perfil
├── plan/                  Armar plan y elegir ubicación en el mapa
├── group/                 Detalle de grupo y crear grupo
├── chat/                  Conversación y chat nuevo
├── connections.tsx        Solicitudes de conexión
├── notificaciones.tsx     Bandeja unificada
└── profile/edit.tsx       Editar perfil

src/
├── components/
│   ├── ui/                8 componentes base: Button, Card, Chip, Avatar…
│   ├── chat/              Visor de Snaps
│   ├── descubrir/         Tarjetas, swipe y filtros
│   ├── grupos/            Tarjeta y banner
│   ├── mapa/              Lienzo, pines de plan y de persona
│   ├── mensajes/          Fila de conversación
│   ├── onboarding/        Selector de "qué buscas"
│   ├── plan/              Selector de ubicación
│   └── navigation/        Barra inferior
├── store/                 9 stores de Zustand
├── theme/                 Paleta y tokens de diseño
├── types/                 Interfaces del dominio
├── lib/                   Cliente HTTP, mappers y almacenamiento seguro
└── utils/                 Utilidades pequeñas

backend/
├── prisma/                Esquema, migraciones y seed
└── src/
    ├── config/            Validación de variables de entorno
    ├── lib/               Prisma, JWT, serializadores
    ├── middleware/        Auth y manejo de errores
    └── modules/           auth · users · interests · plans · groups
                           conversations · connections · location
```

Los archivos `.web.tsx` (`MapCanvas`, `LocationPicker`) son la versión para navegador del mismo componente: Metro elige automáticamente según la plataforma. Ambas comparten la misma interfaz de props.

---

## Sistema de diseño

Todo el color vive en `src/theme/colors.js` y de ahí se derivan las clases de Tailwind. Cambiar la marca es tocar un archivo.

- **Primario:** coral `#FF6F61` — las acciones
- **Secundario:** morado `#6B5B95` — acento
- **Marca UJAP:** navy `#13233E` y dorado `#CCA04F` para las insignias
- **Tipografía:** Inter, cuatro pesos
- **Modo oscuro** completo, con preferencia guardada por usuario

Los 8 componentes de `src/components/ui` son la única forma de construir pantallas. Por eso la app se ve consistente.

### Tono de la copy

Español venezolano neutro, cercano, tuteando siempre. Frases cortas, verbo primero, sin signos de exclamación en la UI del sistema.

- "Armar plan", no "Crear evento"
- "Me apunto", no "Unirse"
- "Échale un epa" para saludar
- Evitar: "click aquí", "exitosamente", "por favor"

En el código las entidades se llaman `events`/`plans`; en la UI siempre se muestran como **planes**.

---

## API

Todas las rutas viven bajo la raíz del servidor. Las marcadas con 🔒 exigen `Authorization: Bearer <token>`.

| Módulo | Rutas |
| --- | --- |
| `auth` | `POST /signup` · `/verify` · `/login` · 🔒`GET /me` · 🔒`PATCH /me` · 🔒`POST /refresh` · 🔒`/heartbeat` · 🔒`/me/photo` · 🔒`/me/cover` · 🔒`/me/photos` · 🔒`PATCH /me/photos/order` |
| `interests` | `GET /interests` |
| `users` | 🔒`GET /users` (Descubrir, con filtros) |
| `plans` | 🔒`GET /` · `GET /:id` · `POST /` · `POST /:id/join` · `POST /:id/leave` |
| `groups` | 🔒 mismas operaciones que planes |
| `conversations` | 🔒`GET /` · `POST /direct` · `POST /group` · `GET /:id/messages` · `POST /:id/messages` · `POST /:id/messages/:messageId/open` · `POST /:id/read` |
| `connections` | 🔒`GET /incoming` · `GET /sent` · `POST /` · `POST /:id/respond` |
| `location` | 🔒`POST /` · `PATCH /sharing` · `GET /people` |
| — | `GET /health` |

---

## Despliegue

Un solo servicio en Render, definido en `render.yaml`, construido con el `Dockerfile` de la raíz. El build compila el export web de Expo y el backend, y el mismo proceso de Express sirve la API y el sitio estático desde `public-web/`.

**Las migraciones no corren al arrancar** — es deliberado. Hay que aplicarlas a mano antes de desplegar código que dependa de columnas nuevas:

```bash
cd backend && npx prisma migrate deploy
```

> ⚠️ **Problema conocido.** El `DATABASE_URL` apunta al *transaction pooler* de Supabase (puerto 6543), que es lo correcto para la app en runtime pero **rompe las migraciones de Prisma**: necesitan bloqueos a nivel de sesión que ese modo no soporta. `migrate deploy` se cuelga o falla a medias.
>
> Mientras no se configure un `directUrl` aparte apuntando al pooler de sesión (puerto 5432), la salida es correr el SQL de la migración a mano en el editor de Supabase y luego registrarla en la tabla `_prisma_migrations`.

---

## Modelo de datos

`User` · `Interest` + `UserInterest` · `Plan` + `PlanAttendee` · `Group` + `GroupMember` · `Conversation` + `ConversationParticipant` · `Message` + `MessageView` · `Connection`

El esquema completo está en `backend/prisma/schema.prisma`. Los enums viven en MAYÚSCULAS en la base de datos y se traducen a valores legibles en español en `src/lib/enumMappers.ts`.

---

## Convenciones

- **Comentarios y nombres de variables en inglés; textos de UI en español.**
- Los comentarios explican **por qué**, no qué hace el código.
- Nada de `any`: el proyecto está en `strict`.
- Nada de dependencias pesadas sin justificarlas antes.
- Componentes nuevos: primero revisar si `src/components/ui` ya lo resuelve.

---

Universidad José Antonio Páez — San Diego, Carabobo, Venezuela.
