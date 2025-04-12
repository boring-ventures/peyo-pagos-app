# Boring Template Expo

Una plantilla avanzada para aplicaciones Expo con autenticación completa y un sistema moderno de navegación.

## Características

- 🔐 Autenticación completa con Supabase
- 📱 Navegación con Expo Router
- 🎨 UI basada en NativeBase
- 📋 Formularios con Formik y Yup
- 🗃️ Gestión de estado con Zustand
- 📦 API HTTP con Axios

## Requisitos Previos

- Node.js 16+
- npm o yarn
- Expo CLI
- Una cuenta en [Expo](https://expo.dev/signup) (necesaria para algunas funcionalidades)

## Instalación

1. Clona el repositorio:

```bash
git clone https://github.com/your-username/boring-template-expo.git
cd boring-template-expo
```

2. Instala las dependencias:

```bash
npm install
# o
yarn install
```

3. Configura las variables de entorno:
   - Crea un archivo `.env` en la raíz del proyecto
   - Añade las variables necesarias (ver [SETUP_SUPABASE.md](./SETUP_SUPABASE.md) para más detalles)

## Iniciar la Aplicación

Para probar la aplicación en tu dispositivo móvil, primero necesitas instalar Expo Go:

- En Android: [Expo Go en Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
- En iOS: [Expo Go en App Store](https://apps.apple.com/app/apple-store/id982107779)

```bash
npx expo start --go
```

También puedes usar la opción `--dev-client` si has creado un cliente de desarrollo personalizado:

```bash
npx expo start --dev-client
```

## Estructura del Proyecto

```
boring-template-expo/
├── app/                    # Aplicación principal (Expo Router)
│   ├── (private)/          # Rutas autenticadas
│   ├── (public)/           # Rutas públicas
│   ├── (auth)/             # Restaurar sesión
│   ├── components/         # Componentes reutilizables
│   ├── hooks/              # Hooks personalizados
│   ├── services/           # Servicios (API, etc.)
│   ├── stores/             # Gestión de estado (Zustand)
│   ├── types/              # Tipos TypeScript
│   ├── utils/              # Utilidades
│   └── index.tsx           # Punto de entrada
├── assets/                 # Imágenes, fuentes, etc.
└── ...
```

## Configuración

Para configurar Supabase para autenticación, consulta [SETUP_SUPABASE.md](./SETUP_SUPABASE.md).

## Contribución

Las contribuciones son bienvenidas! Por favor, lee las [directrices de contribución](./CONTRIBUTING.md) antes de enviar un pull request.

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](./LICENSE) para más detalles.
