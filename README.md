# Boring Template Expo

An advanced template for Expo applications with full authentication and a modern navigation system.

## Features

- 🔐 Full authentication with Supabase
- 📱 Navigation with Expo Router
- 🎨 UI with React Native components and StyleSheet
- 📋 Forms with Formik and Yup
- 🗃️ State management with Zustand

## Prerequisites

- Node.js 16+
- npm or yarn
- Expo CLI
- An [Expo account](https://expo.dev/signup) (required for some features)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/boring-template-expo.git
cd boring-template-expo
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Configure environment variables:
   - Create a `.env` file in the project root
   - Add the required variables (see [SETUP_SUPABASE.md](./SETUP_SUPABASE.md) for details)

## Running the App

To test the app on your mobile device, first install Expo Go:

- On Android: [Expo Go on Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
- On iOS: [Expo Go on App Store](https://apps.apple.com/app/apple-store/id982107779)

```bash
npx expo start --go
```

You can also use the `--dev-client` option if you have created a custom development client:

```bash
npx expo start --dev-client
```

## Project Structure

```
boring-template-expo/
├── app/                    # Main application (Expo Router)
│   ├── (private)/          # Authenticated routes
│   ├── (public)/           # Public routes
│   ├── (auth)/             # Session restore
│   ├── components/         # Reusable components
│   ├── hooks/              # Custom hooks
│   ├── services/           # Services (API, etc.)
│   ├── store/              # State management (Zustand)
│   ├── constants/          # Shared constants
│   └── index.tsx           # Entry point
├── assets/                 # Images, fonts, etc.
└── ...
```

## Configuration

To set up Supabase authentication, see [SETUP_SUPABASE.md](./SETUP_SUPABASE.md).

## Contributing

Contributions are welcome! Please read the [contribution guidelines](./CONTRIBUTING.md) before submitting a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
