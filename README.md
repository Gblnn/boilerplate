# React + TypeScript + Firebase Boilerplate

This is a modern React boilerplate project that includes authentication, protected routes, and persistent login state using Firebase Authentication. Built with TypeScript and Vite for optimal development experience.

## Features

- 🔐 Firebase Authentication
  - Email/Password authentication
  - Google Sign-in
  - Persistent authentication state
- 🛡️ Protected Routes
- 🎨 Modern UI with Tailwind CSS
- 📱 Responsive Layout
- 🚀 Fast development with Vite
- 🔍 Type safety with TypeScript

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase project

### Setup

1. Clone the repository:

```bash
git clone <your-repo-url>
cd <your-repo-name>
```

2. Install dependencies:

```bash
npm install
# or
yarn
```

3. Create a Firebase project:

- Go to [Firebase Console](https://console.firebase.google.com)
- Create a new project
- Enable Authentication (Email/Password and Google providers)
- Copy your Firebase configuration

4. Set up environment variables:

```bash
cp .env.example .env
```

Then fill in your Firebase configuration values in the `.env` file.

5. Start the development server:

```bash
npm run dev
# or
yarn dev
```

## Project Structure

```
src/
├── components/
│   ├── common/
│   │   └── ProtectedRoute.tsx
│   └── layout/
│       └── MainLayout.tsx
├── context/
│   └── AuthContext.tsx
├── pages/
│   └── Login.tsx
├── config/
│   └── firebase.ts
├── App.tsx
└── main.tsx
```

## Authentication

The boilerplate includes a complete authentication system with:

- User registration
- Login with email/password
- Login with Google
- Protected routes
- Persistent authentication state
- Logout functionality

## Customization

### Styling

The project uses Tailwind CSS for styling. You can customize the theme in the `tailwind.config.js` file.

### Routes

Add new routes in `App.tsx`. Use the `ProtectedRoute` component to make a route accessible only to authenticated users.

### Firebase Features

You can easily add more Firebase features by importing them from the Firebase SDK and initializing them in `src/config/firebase.ts`.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
#   b o i l e r p l a t e  
 #   b o i l e r p l a t e  
 #   p o i n t s a l e  
 