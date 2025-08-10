# Exploragon - Complete Project Export

This document contains the entire Exploragon project codebase for analysis by another LLM.

## Project Overview

Exploragon is a location-based challenge app built with React and Vite. It's designed as a San Francisco exploration game where users complete challenges at hexagonal locations throughout the city. The app features:

- Interactive map with hexagon-based challenges
- Camera/file upload for challenge submissions  
- AI-powered verification system
- Leaderboard and user profiles
- Real-time location tracking

## Project Structure

```
exploragon-19fdc01e/
├── README.md
├── BACKEND_INTEGRATION.md
├── package.json
├── vite.config.js
├── tailwind.config.js
├── eslint.config.js
├── postcss.config.js
├── jsconfig.json
├── components.json
├── index.html
├── app/                    # Next.js pages (alternative structure)
│   ├── layout.js
│   ├── page.js
│   ├── leaderboard/page.js
│   ├── map/page.js
│   └── profile/page.js
├── src/
│   ├── main.jsx           # React entry point
│   ├── App.jsx            # Main app component
│   ├── App.css
│   ├── index.css          # Global styles with Tailwind
│   ├── api/               # API layer
│   │   ├── base44Client.js
│   │   ├── entities.js
│   │   └── integrations.js
│   ├── components/        # React components
│   │   ├── map/
│   │   │   ├── ChallengeModal.jsx
│   │   │   ├── HexagonInfo.jsx
│   │   │   └── LocationTracker.jsx
│   │   └── ui/            # Shadcn UI components
│   │       ├── accordion.jsx
│   │       ├── alert.jsx
│   │       ├── button.jsx
│   │       ├── card.jsx
│   │       ├── dialog.jsx
│   │       ├── sidebar.jsx
│   │       └── [30+ other UI components]
│   ├── hooks/
│   │   └── use-mobile.jsx
│   ├── lib/
│   │   ├── data.js        # Local data layer with mock data
│   │   └── utils.js       # Utility functions
│   ├── pages/             # Main page components
│   │   ├── index.jsx      # Router setup
│   │   ├── Layout.jsx     # App layout with sidebar
│   │   ├── Map.jsx        # Interactive map page
│   │   ├── Leaderboard.jsx
│   │   └── Profile.jsx
│   └── utils/
│       └── index.ts       # TypeScript utilities
└── node_modules/
```

---

## Configuration Files

### package.json
```json
{
  "name": "base44-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@base44/sdk": "^0.1.2",
    "@hookform/resolvers": "^4.1.2",
    "@radix-ui/react-accordion": "^1.2.3",
    "@radix-ui/react-alert-dialog": "^1.1.6",
    "@radix-ui/react-aspect-ratio": "^1.1.2",
    "@radix-ui/react-avatar": "^1.1.3",
    "@radix-ui/react-checkbox": "^1.1.4",
    "@radix-ui/react-collapsible": "^1.1.3",
    "@radix-ui/react-context-menu": "^2.2.6",
    "@radix-ui/react-dialog": "^1.1.6",
    "@radix-ui/react-dropdown-menu": "^2.1.6",
    "@radix-ui/react-hover-card": "^1.1.6",
    "@radix-ui/react-label": "^2.1.2",
    "@radix-ui/react-menubar": "^1.1.6",
    "@radix-ui/react-navigation-menu": "^1.2.5",
    "@radix-ui/react-popover": "^1.1.6",
    "@radix-ui/react-progress": "^1.1.2",
    "@radix-ui/react-radio-group": "^1.2.3",
    "@radix-ui/react-scroll-area": "^1.2.3",
    "@radix-ui/react-select": "^2.1.6",
    "@radix-ui/react-separator": "^1.1.2",
    "@radix-ui/react-slider": "^1.2.3",
    "@radix-ui/react-slot": "^1.1.2",
    "@radix-ui/react-switch": "^1.1.3",
    "@radix-ui/react-tabs": "^1.1.3",
    "@radix-ui/react-toggle": "^1.1.2",
    "@radix-ui/react-toggle-group": "^1.1.2",
    "@radix-ui/react-tooltip": "^1.1.8",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.0.0",
    "date-fns": "^3.6.0",
    "embla-carousel-react": "^8.5.2",
    "framer-motion": "^12.4.7",
    "input-otp": "^1.4.2",
    "lucide-react": "^0.475.0",
    "next-themes": "^0.4.4",
    "react": "^18.2.0",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.54.2",
    "react-resizable-panels": "^2.1.7",
    "react-router-dom": "^7.2.0",
    "recharts": "^2.15.1",
    "sonner": "^2.0.1",
    "tailwind-merge": "^3.0.2",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^1.1.2",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@eslint/js": "^9.19.0",
    "@flydotio/dockerfile": "^0.7.8",
    "@types/node": "^22.13.5",
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.19.0",
    "eslint-plugin-react": "^7.37.4",
    "eslint-plugin-react-hooks": "^5.0.0",
    "eslint-plugin-react-refresh": "^0.4.18",
    "globals": "^15.14.0",
    "postcss": "^8.5.3",
    "tailwindcss": "^3.4.17",
    "vite": "^6.3.5"
  }
}
```

### vite.config.js
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
})
```

### tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
```

---

## Core Application Files

### index.html
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="https://base44.com/logo_v2.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Base44 APP</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### src/main.jsx
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
)
```

### src/App.jsx
```jsx
import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"

function App() {
  return (
    <>
      <Pages />
      <Toaster />
    </>
  )
}

export default App
```

### src/index.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3.9%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 0 0% 96.1%;
    --accent-foreground: 0 0% 9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --ring: 0 0% 3.9%;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
    --radius: 0.5rem;
    --sidebar-background: 0 0% 98%;
    --sidebar-foreground: 240 5.3% 26.1%;
    --sidebar-primary: 240 5.9% 10%;
    --sidebar-primary-foreground: 0 0% 98%;
    --sidebar-accent: 240 4.8% 95.9%;
    --sidebar-accent-foreground: 240 5.9% 10%;
    --sidebar-border: 220 13% 91%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }
  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    --card: 0 0% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 9%;
    --secondary: 0 0% 14.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 14.9%;
    --muted-foreground: 0 0% 63.9%;
    --accent: 0 0% 14.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 14.9%;
    --input: 0 0% 14.9%;
    --ring: 0 0% 83.1%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
    --sidebar-background: 240 5.9% 10%;
    --sidebar-foreground: 240 4.8% 95.9%;
    --sidebar-primary: 224.3 76.3% 48%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 240 3.7% 15.9%;
    --sidebar-accent-foreground: 240 4.8% 95.9%;
    --sidebar-border: 240 3.7% 15.9%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

---

## API Layer

### src/api/base44Client.js
```javascript
import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "6897f167ee08ca5c19fdc01e", 
  requiresAuth: true // Ensure authentication is required for all operations
});
```

### src/api/entities.js
```javascript
import { base44 } from './base44Client';

export const Hexagon = base44.entities.Hexagon;
export const Submission = base44.entities.Submission;

// auth sdk:
export const User = base44.auth;
```

### src/api/integrations.js
```javascript
import { base44 } from './base44Client';

export const Core = base44.integrations.Core;
export const InvokeLLM = base44.integrations.Core.InvokeLLM;
export const SendEmail = base44.integrations.Core.SendEmail;
export const UploadFile = base44.integrations.Core.UploadFile;
export const GenerateImage = base44.integrations.Core.GenerateImage;
export const ExtractDataFromUploadedFile = base44.integrations.Core.ExtractDataFromUploadedFile;
```

### src/lib/data.js (Local Data Layer)
```javascript
// Local data storage and management
// Replaces Base44 SDK entities

// Sample hexagon data for San Francisco
const defaultHexagons = [
  {
    id: 'hex_1',
    hex_id: 'hex_1', 
    location_name: 'Golden Gate Bridge',
    challenge_title: 'Capture the Golden Gate',
    challenge_description: 'Take a photo of yourself with the Golden Gate Bridge in the background',
    challenge_type: 'photo',
    difficulty: 'easy',
    point_value: 10,
    center_lat: 37.8199,
    center_lng: -122.4783,
    is_landmark: true,
    boundary_coords: [
      [37.8199, -122.4783],
      [37.8209, -122.4773],
      [37.8189, -122.4793],
      [37.8199, -122.4783]
    ]
  },
  {
    id: 'hex_2',
    hex_id: 'hex_2',
    location_name: 'Fishermans Wharf',
    challenge_title: 'Sea Lion Selfie',
    challenge_description: 'Take a photo near the sea lions at Pier 39',
    challenge_type: 'photo',
    difficulty: 'easy',
    point_value: 15,
    center_lat: 37.8087,
    center_lng: -122.4098,
    is_landmark: true,
    boundary_coords: [
      [37.8087, -122.4098],
      [37.8097, -122.4088],
      [37.8077, -122.4108],
      [37.8087, -122.4098]
    ]
  },
  {
    id: 'hex_3',
    hex_id: 'hex_3',
    location_name: 'Lombard Street',
    challenge_title: 'Crookedest Street Challenge',
    challenge_description: 'Take a video walking down the famous crooked street',
    challenge_type: 'video',
    difficulty: 'medium',
    point_value: 25,
    center_lat: 37.8021,
    center_lng: -122.4187,
    is_landmark: false,
    boundary_coords: [
      [37.8021, -122.4187],
      [37.8031, -122.4177],
      [37.8011, -122.4197],
      [37.8021, -122.4187]
    ]
  }
];

// Local storage keys
const STORAGE_KEYS = {
  hexagons: 'exploragon_hexagons',
  submissions: 'exploragon_submissions', 
  currentUser: 'exploragon_current_user',
  users: 'exploragon_users'
};

// Utility functions
function getFromStorage(key, defaultValue = []) {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
}

function saveToStorage(key, data) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
}

function generateId() {
  return Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
}

// Hexagon entity replacement
export const Hexagon = {
  async list() {
    let hexagons = getFromStorage(STORAGE_KEYS.hexagons);
    
    // Initialize with default data if empty
    if (hexagons.length === 0) {
      hexagons = defaultHexagons;
      saveToStorage(STORAGE_KEYS.hexagons, hexagons);
    }
    
    return hexagons;
  },

  async get(id) {
    const hexagons = await this.list();
    return hexagons.find(h => h.id === id || h.hex_id === id);
  },

  async create(data) {
    const hexagons = await this.list();
    const newHexagon = {
      id: generateId(),
      hex_id: data.hex_id || generateId(),
      created_date: new Date().toISOString(),
      ...data
    };
    
    hexagons.push(newHexagon);
    saveToStorage(STORAGE_KEYS.hexagons, hexagons);
    return newHexagon;
  }
};

// Submission entity replacement  
export const Submission = {
  async list() {
    return getFromStorage(STORAGE_KEYS.submissions);
  },

  async create(data) {
    const submissions = await this.list();
    const newSubmission = {
      id: generateId(),
      created_date: new Date().toISOString(),
      created_by: getCurrentUser()?.email || 'anonymous@example.com',
      verification_status: data.verification_status || 'pending',
      ...data
    };
    
    submissions.push(newSubmission);
    saveToStorage(STORAGE_KEYS.submissions, submissions);
    return newSubmission;
  },

  async get(id) {
    const submissions = await this.list();
    return submissions.find(s => s.id === id);
  },

  async update(id, updates) {
    const submissions = await this.list();
    const index = submissions.findIndex(s => s.id === id);
    
    if (index !== -1) {
      submissions[index] = { ...submissions[index], ...updates };
      saveToStorage(STORAGE_KEYS.submissions, submissions);
      return submissions[index];
    }
    
    return null;
  }
};

// User/Auth entity replacement
function getCurrentUser() {
  return getFromStorage(STORAGE_KEYS.currentUser, null);
}

function setCurrentUser(user) {
  saveToStorage(STORAGE_KEYS.currentUser, user);
}

export const User = {
  async me() {
    let user = getCurrentUser();
    
    // Create default user if none exists
    if (!user) {
      user = {
        id: generateId(),
        email: 'explorer@example.com',
        full_name: 'Explorer',
        created_date: new Date().toISOString()
      };
      setCurrentUser(user);
    }
    
    return user;
  },

  async login(email) {
    // Simple email-based auth for demo
    const user = {
      id: generateId(),
      email: email,
      full_name: email.split('@')[0],
      created_date: new Date().toISOString()
    };
    
    setCurrentUser(user);
    return user;
  },

  async logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.currentUser);
    }
    return true;
  }
};

// Mock integrations to replace Base44 integrations
export const MockIntegrations = {
  async UploadFile({ file }) {
    // Convert file to base64 for local storage
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const fileUrl = reader.result;
        resolve({ file_url: fileUrl });
      };
      reader.readAsDataURL(file);
    });
  },

  async InvokeLLM({ prompt, file_urls, response_json_schema }) {
    // Mock AI verification with random results
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
    
    const passed = Math.random() > 0.3; // 70% success rate
    
    return {
      passed,
      feedback: passed 
        ? "Great submission! The challenge appears to be completed successfully."
        : "The submission doesn't fully meet the challenge requirements. Please try again.",
      confidence: Math.random() * 0.4 + 0.6 // 0.6-1.0 confidence
    };
  }
};
```

---

## Page Components

### src/pages/index.jsx (Router Setup)
```jsx
import Layout from "./Layout.jsx";
import Map from "./Map";
import Leaderboard from "./Leaderboard";
import Profile from "./Profile";
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    Map: Map,
    Leaderboard: Leaderboard,
    Profile: Profile,
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                <Route path="/" element={<Map />} />
                <Route path="/Map" element={<Map />} />
                <Route path="/Leaderboard" element={<Leaderboard />} />
                <Route path="/Profile" element={<Profile />} />
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}
```

### src/pages/Layout.jsx
```jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Map, Trophy, User, Hexagon as HexagonIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "Explore",
    url: createPageUrl("Map"),
    icon: Map,
  },
  {
    title: "Leaderboard", 
    url: createPageUrl("Leaderboard"),
    icon: Trophy,
  },
  {
    title: "Profile",
    url: createPageUrl("Profile"),
    icon: User,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  return (
    <SidebarProvider>
      <style>{`
        :root {
          --background: 0 0% 3.9%;
          --foreground: 0 0% 98%;
          --card: 0 0% 3.9%;
          --card-foreground: 0 0% 98%;
          --popover: 0 0% 3.9%;
          --popover-foreground: 0 0% 98%;
          --primary: 199 89% 48%;
          --primary-foreground: 0 0% 9%;
          --secondary: 0 0% 14.9%;
          --secondary-foreground: 0 0% 98%;
          --muted: 0 0% 14.9%;
          --muted-foreground: 0 0% 63.9%;
          --accent: 0 0% 14.9%;
          --accent-foreground: 0 0% 98%;
          --destructive: 0 62.8% 30.6%;
          --destructive-foreground: 0 0% 98%;
          --border: 0 0% 14.9%;
          --input: 0 0% 14.9%;
          --ring: 199 89% 48%;
        }
        
        body {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
          min-height: 100vh;
        }
        
        .hex-pattern {
          background-image: url("data:image/svg+xml,%3csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='none' fill-rule='evenodd'%3e%3cg fill='%23334155' fill-opacity='0.1'%3e%3cpath d='M15 30l15-8.66v17.32L15 30zm15-8.66L45 30l-15 8.66V21.34z'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e");
        }
      `}</style>
      
      <div className="min-h-screen flex w-full bg-slate-900 hex-pattern">
        <Sidebar className="border-r border-slate-700/50 bg-slate-900/80 backdrop-blur-xl">
          <SidebarHeader className="border-b border-slate-700/50 p-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/25">
                  <HexagonIcon className="w-6 h-6 text-slate-900" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h2 className="font-bold text-xl text-white">Exploragon</h2>
                <p className="text-xs text-slate-400">San Francisco Explorer</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-4">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-slate-700/50 hover:text-cyan-400 transition-all duration-200 rounded-xl mb-2 ${
                          location.pathname === item.url ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-300'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <div className="mt-8 p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
              <h3 className="font-semibold text-white mb-2">Weekly Challenge</h3>
              <p className="text-sm text-slate-300 mb-3">Complete 5 hexagons to unlock special rewards!</p>
              <div className="w-full bg-slate-700/50 rounded-full h-2">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{width: '40%'}}></div>
              </div>
              <p className="text-xs text-slate-400 mt-1">2/5 completed</p>
            </div>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile header */}
          <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 px-6 py-4 md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-slate-700/50 p-2 rounded-lg transition-colors duration-200 text-slate-300" />
              <h1 className="text-xl font-bold text-white">Exploragon</h1>
            </div>
          </header>

          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
```

### src/pages/Map.jsx
```jsx
import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Polygon, CircleMarker, useMap } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Target, Trophy, Zap, MapPin, LocateFixed } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Hexagon, Submission } from "@/api/entities";
import { User } from "@/api/entities";
import "leaflet/dist/leaflet.css";

import ChallengeModal from "../components/map/ChallengeModal";
import LocationTracker from "../components/map/LocationTracker";
import HexagonInfo from "../components/map/HexagonInfo";

// San Francisco center coordinates
const SF_CENTER = [37.7749, -122.4194];

// Custom map styles
const mapStyles = `
  .leaflet-container {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  }
  .leaflet-tile-pane {
    filter: contrast(1.1) saturate(0.8) brightness(0.9);
  }
  .custom-hexagon {
    stroke: #0ea5e9;
    stroke-width: 2;
    fill: rgba(14, 165, 233, 0.1);
    transition: all 0.3s ease;
  }
  .custom-hexagon:hover {
    fill: rgba(14, 165, 233, 0.3);
    stroke-width: 3;
  }
  .completed-hexagon {
    stroke: #10b981;
    fill: rgba(16, 185, 129, 0.2);
  }
  .landmark-hexagon {
    stroke: #f59e0b;
    fill: rgba(245, 158, 11, 0.15);
    animation: pulse-glow 2s infinite;
  }
  @keyframes pulse-glow {
    0%, 100% { stroke-opacity: 0.8; }
    50% { stroke-opacity: 1; }
  }
`;

export default function MapPage() {
  const [map, setMap] = useState(null);
  const [hexagons, setHexagons] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [selectedHexagon, setSelectedHexagon] = useState(null);
  const [nearbyHexagons, setNearbyHexagons] = useState([]);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [userStats, setUserStats] = useState({ totalPoints: 0, completedHexagons: 0 });
  const [loading, setLoading] = useState(true);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    loadData();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentPosition([position.coords.latitude, position.coords.longitude]);
        },
        (error) => console.error("Error getting location:", error)
      );
    }
  }, []);

  useEffect(() => {
    // Set initial map view to current position once map and position are available
    if (map && currentPosition && isInitialLoadRef.current) {
      map.setView(currentPosition, 15);
      isInitialLoadRef.current = false;
    }
  }, [map, currentPosition]);

  const loadData = async () => {
    try {
      const [hexagonData, submissionData] = await Promise.all([
        Hexagon.list(),
        Submission.list()
      ]);
      
      setHexagons(hexagonData);
      setSubmissions(submissionData);
      
      // Calculate user stats
      const userSubmissions = submissionData.filter(s => s.verification_status === 'approved');
      const totalPoints = userSubmissions.reduce((sum, s) => sum + (s.points_awarded || 0), 0);
      setUserStats({
        totalPoints,
        completedHexagons: userSubmissions.length
      });
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const isHexagonCompleted = (hexagonId) => {
    return submissions.some(s => s.hexagon_id === hexagonId && s.verification_status === 'approved');
  };

  const handleHexagonClick = (hexagon) => {
    setSelectedHexagon(hexagon);
    
    if (currentPosition) {
      const distance = calculateDistance(
        currentPosition[0], currentPosition[1],
        hexagon.center_lat, hexagon.center_lng
      );
      
      if (distance <= 100) { // Within 100 meters
        setShowChallengeModal(true);
      }
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const handleRecenter = () => {
    if (map && currentPosition) {
      map.flyTo(currentPosition, 15);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Loading the city...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative overflow-hidden">
      <style>{mapStyles}</style>
      
      {/* Stats Bar */}
      <div className="absolute top-4 left-4 right-4 z-[1000] pointer-events-none">
        <div className="flex justify-between items-center">
          <Card className="bg-slate-900/90 backdrop-blur-xl border-slate-700/50 pointer-events-auto">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <span className="font-bold text-white">{userStats.totalPoints}</span>
                  <span className="text-slate-400 text-sm">pts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-cyan-400" />
                  <span className="font-bold text-white">{userStats.completedHexagons}</span>
                  <span className="text-slate-400 text-sm">completed</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/90 backdrop-blur-xl border-slate-700/50 pointer-events-auto">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-400" />
                <span className="text-white text-sm">San Francisco</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recenter Button */}
      <div className="absolute bottom-24 md:bottom-6 right-6 z-[1000]">
        <Button
          variant="secondary"
          size="icon"
          onClick={handleRecenter}
          className="bg-slate-900/90 backdrop-blur-xl border-slate-700/50 hover:bg-slate-800/90 text-white rounded-full h-12 w-12 shadow-lg"
          aria-label="Recenter map"
        >
          <LocateFixed className="w-5 h-5" />
        </Button>
      </div>
      
      {/* Map */}
      <MapContainer
        center={SF_CENTER}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        className="z-0"
        whenCreated={setMap}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {/* Hexagons */}
        {hexagons.map((hexagon) => (
          <Polygon
            key={hexagon.id}
            positions={hexagon.boundary_coords}
            className={`custom-hexagon ${
              isHexagonCompleted(hexagon.hex_id) ? 'completed-hexagon' : ''
            } ${hexagon.is_landmark ? 'landmark-hexagon' : ''}`}
            eventHandlers={{
              click: () => handleHexagonClick(hexagon),
            }}
          />
        ))}

        {/* Current position */}
        {currentPosition && (
          <CircleMarker
            center={currentPosition}
            radius={8}
            fillColor="#06b6d4"
            color="#ffffff"
            weight={3}
            opacity={1}
            fillOpacity={0.8}
          />
        )}
      </MapContainer>

      {/* Bottom Info Panel */}
      <AnimatePresence>
        {selectedHexagon && (
          <motion.div
            initial={{ y: 300 }}
            animate={{ y: 0 }}
            exit={{ y: 300 }}
            className="absolute bottom-0 left-0 right-0 z-[1000]"
          >
            <HexagonInfo
              hexagon={selectedHexagon}
              isCompleted={isHexagonCompleted(selectedHexagon.hex_id)}
              onClose={() => setSelectedHexagon(null)}
              onStartChallenge={() => setShowChallengeModal(true)}
              userPosition={currentPosition}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Challenge Modal */}
      <ChallengeModal
        isOpen={showChallengeModal}
        onClose={() => setShowChallengeModal(false)}
        hexagon={selectedHexagon}
        onSubmissionComplete={() => {
          loadData();
          setShowChallengeModal(false);
          setSelectedHexagon(null);
        }}
      />

      <LocationTracker onLocationUpdate={setCurrentPosition} />
    </div>
  );
}
```

### src/pages/Leaderboard.jsx
```jsx
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Crown, Star, TrendingUp, User as UserIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Submission } from "@/api/entities";
import { User } from "@/api/entities";

export default function LeaderboardPage() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all');

  useEffect(() => {
    loadLeaderboardData();
  }, [timeFilter]);

  const loadLeaderboardData = async () => {
    setLoading(true);
    try {
      const [submissions, user] = await Promise.all([
        Submission.list(),
        User.me().catch(() => null)
      ]);

      setCurrentUser(user);

      // Group submissions by user and calculate stats
      const userSubmissions = {};
      
      submissions
        .filter(s => s.verification_status === 'approved')
        .forEach(submission => {
          const userId = submission.created_by;
          if (!userSubmissions[userId]) {
            userSubmissions[userId] = {
              email: userId,
              totalPoints: 0,
              completedChallenges: 0,
              submissions: []
            };
          }
          
          userSubmissions[userId].totalPoints += submission.points_awarded || 0;
          userSubmissions[userId].completedChallenges += 1;
          userSubmissions[userId].submissions.push(submission);
        });

      // Convert to array and sort by points
      const leaderboard = Object.values(userSubmissions)
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .map((user, index) => ({
          ...user,
          rank: index + 1,
          displayName: user.email.split('@')[0] // Use email prefix as display name
        }));

      setLeaderboardData(leaderboard);

      // Set current user stats
      if (user) {
        const currentUserStats = userSubmissions[user.email];
        setUserStats(currentUserStats || {
          totalPoints: 0,
          completedChallenges: 0,
          rank: leaderboard.length + 1
        });
      }

    } catch (error) {
      console.error("Error loading leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch(rank) {
      case 1: return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2: return <Medal className="w-6 h-6 text-gray-300" />;
      case 3: return <Medal className="w-6 h-6 text-amber-600" />;
      default: return <Trophy className="w-5 h-5 text-slate-400" />;
    }
  };

  const getRankGradient = (rank) => {
    switch(rank) {
      case 1: return "from-yellow-400/20 to-amber-500/20 border-yellow-400/30";
      case 2: return "from-slate-300/20 to-slate-400/20 border-slate-300/30";
      case 3: return "from-amber-600/20 to-orange-500/20 border-amber-600/30";
      default: return "from-slate-700/20 to-slate-800/20 border-slate-600/30";
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-900 overflow-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl">
              <Trophy className="w-8 h-8 text-slate-900" />
            </div>
            <h1 className="text-4xl font-bold text-white">Leaderboard</h1>
          </div>
          <p className="text-slate-400">Compete with explorers across San Francisco</p>
        </div>

        {/* Current User Stats */}
        {userStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Your Progress</h3>
                      <p className="text-slate-400 text-sm">{currentUser?.email.split('@')[0]}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-cyan-400">{userStats.totalPoints || 0}</p>
                        <p className="text-xs text-slate-400">Points</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-white">{userStats.completedChallenges || 0}</p>
                        <p className="text-xs text-slate-400">Completed</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-amber-400">#{userStats.rank || 'N/A'}</p>
                        <p className="text-xs text-slate-400">Rank</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Time Filter Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800 border-slate-700">
            <TabsTrigger value="all" className="text-slate-300 data-[state=active]:text-white">All Time</TabsTrigger>
            <TabsTrigger value="week" className="text-slate-300 data-[state=active]:text-white">This Week</TabsTrigger>
            <TabsTrigger value="month" className="text-slate-300 data-[state=active]:text-white">This Month</TabsTrigger>
            <TabsTrigger value="today" className="text-slate-300 data-[state=active]:text-white">Today</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-6">
            {/* Top 3 Podium */}
            {leaderboardData.length >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-3 gap-4 mb-8"
              >
                {/* 2nd Place */}
                <Card className={`bg-gradient-to-br ${getRankGradient(2)} border mt-8`}>
                  <CardContent className="p-4 text-center">
                    <div className="flex justify-center mb-2">
                      {getRankIcon(2)}
                    </div>
                    <h3 className="font-semibold text-white">{leaderboardData[1]?.displayName}</h3>
                    <p className="text-2xl font-bold text-slate-300 mt-1">{leaderboardData[1]?.totalPoints}</p>
                    <p className="text-xs text-slate-400">points</p>
                  </CardContent>
                </Card>

                {/* 1st Place */}
                <Card className={`bg-gradient-to-br ${getRankGradient(1)} border`}>
                  <CardContent className="p-6 text-center">
                    <div className="flex justify-center mb-3">
                      {getRankIcon(1)}
                    </div>
                    <h3 className="font-semibold text-white text-lg">{leaderboardData[0]?.displayName}</h3>
                    <p className="text-3xl font-bold text-yellow-400 mt-2">{leaderboardData[0]?.totalPoints}</p>
                    <p className="text-sm text-slate-300">points</p>
                    <Badge className="bg-yellow-400/20 text-yellow-400 border-yellow-400/30 mt-2">
                      <Crown className="w-3 h-3 mr-1" />
                      Champion
                    </Badge>
                  </CardContent>
                </Card>

                {/* 3rd Place */}
                <Card className={`bg-gradient-to-br ${getRankGradient(3)} border mt-8`}>
                  <CardContent className="p-4 text-center">
                    <div className="flex justify-center mb-2">
                      {getRankIcon(3)}
                    </div>
                    <h3 className="font-semibold text-white">{leaderboardData[2]?.displayName}</h3>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{leaderboardData[2]?.totalPoints}</p>
                    <p className="text-xs text-slate-400">points</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Full Leaderboard */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  Full Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {leaderboardData.map((player, index) => (
                  <motion.div
                    key={player.email}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 hover:bg-slate-700/30 ${
                      currentUser?.email === player.email 
                        ? 'bg-cyan-500/10 border-cyan-500/30' 
                        : 'bg-slate-700/20 border-slate-600/30'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        {getRankIcon(player.rank)}
                        <span className="text-lg font-semibold text-slate-300">#{player.rank}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{player.displayName}</h3>
                        <p className="text-sm text-slate-400">{player.completedChallenges} challenges completed</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-cyan-400">{player.totalPoints}</p>
                      <p className="text-xs text-slate-400">points</p>
                    </div>
                  </motion.div>
                ))}

                {leaderboardData.length === 0 && (
                  <div className="text-center py-12">
                    <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-400 mb-2">No players yet</h3>
                    <p className="text-slate-500">Complete your first challenge to appear on the leaderboard!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other time periods would show filtered data */}
          <TabsContent value="week">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-12 text-center">
                <h3 className="text-lg text-slate-400 mb-2">Weekly Leaderboard</h3>
                <p className="text-slate-500">Coming soon - track weekly progress and compete for special rewards!</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="month">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-12 text-center">
                <h3 className="text-lg text-slate-400 mb-2">Monthly Leaderboard</h3>
                <p className="text-slate-500">Coming soon - monthly competitions with exclusive prizes!</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="today">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-12 text-center">
                <h3 className="text-lg text-slate-400 mb-2">Daily Leaderboard</h3>
                <p className="text-slate-500">Coming soon - daily challenges and quick competitions!</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
```

---

## Key Components

### src/components/map/ChallengeModal.jsx
```jsx
import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Camera, Video, Upload, X, CheckCircle2, 
  Loader2, Trophy, Zap, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadFile, InvokeLLM } from "@/api/integrations";
import { Submission } from "@/api/entities";
import { User } from "@/api/entities";

export default function ChallengeModal({ 
  isOpen, 
  onClose, 
  hexagon, 
  onSubmissionComplete 
}) {
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setMediaFile(file);
      const previewUrl = URL.createObjectURL(file);
      setMediaPreview(previewUrl);
      setError(null);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: hexagon.challenge_type === 'video'
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOpen(true);
      setError(null);
    } catch (err) {
      setError("Could not access camera. Please try uploading a file instead.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const captureMedia = async () => {
    if (!videoRef.current) return;

    if (hexagon.challenge_type === 'video') {
      // For video, we'd need to implement video recording
      setError("Video recording not yet implemented. Please upload a video file.");
      return;
    }

    // Capture photo
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);

    canvas.toBlob((blob) => {
      const file = new File([blob], `challenge-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
      stopCamera();
    }, 'image/jpeg', 0.8);
  };

  const submitChallenge = async () => {
    if (!mediaFile || !hexagon) return;

    setIsUploading(true);
    setError(null);

    try {
      // Get current position
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      // Upload media file
      const { file_url } = await UploadFile({ file: mediaFile });

      setIsUploading(false);
      setIsVerifying(true);

      // AI verification
      const verificationPrompt = `
        Analyze this ${hexagon.challenge_type} submission for the challenge: "${hexagon.challenge_description}"
        
        Location: ${hexagon.location_name || 'San Francisco'}
        Challenge Type: ${hexagon.challenge_type}
        
        Please verify:
        1. Does the submission show the user completing the requested challenge?
        2. Does the location appear authentic and consistent with ${hexagon.location_name}?
        3. Is this a legitimate attempt (not fake/staged inappropriately)?
        
        Respond with verification details and whether this passes or fails.
      `;

      const verificationResponse = await InvokeLLM({
        prompt: verificationPrompt,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            passed: { type: "boolean" },
            feedback: { type: "string" },
            confidence: { type: "number" }
          }
        }
      });

      // Create submission record
      const submissionData = {
        hexagon_id: hexagon.hex_id,
        media_url: file_url,
        media_type: hexagon.challenge_type === 'video' ? 'video' : 'photo',
        submission_lat: position.coords.latitude,
        submission_lng: position.coords.longitude,
        verification_status: verificationResponse.passed ? 'approved' : 'rejected',
        points_awarded: verificationResponse.passed ? hexagon.point_value : 0,
        ai_feedback: verificationResponse.feedback
      };

      await Submission.create(submissionData);

      setVerificationResult({
        passed: verificationResponse.passed,
        feedback: verificationResponse.feedback,
        points: verificationResponse.passed ? hexagon.point_value : 0
      });

    } catch (err) {
      console.error("Submission error:", err);
      setError("Failed to submit challenge. Please try again.");
    } finally {
      setIsUploading(false);
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setMediaFile(null);
    setMediaPreview(null);
    setVerificationResult(null);
    setError(null);
    onClose();
  };

  const handleComplete = () => {
    onSubmissionComplete();
    handleClose();
  };

  if (!hexagon) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg">
              {hexagon.challenge_type === 'video' ? (
                <Video className="w-5 h-5 text-white" />
              ) : (
                <Camera className="w-5 h-5 text-white" />
              )}
            </div>
            Challenge: {hexagon.challenge_title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <p className="text-slate-300 mb-3">{hexagon.challenge_description}</p>
            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
              <Trophy className="w-3 h-3 mr-1" />
              {hexagon.point_value} points
            </Badge>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <AnimatePresence mode="wait">
            {verificationResult ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg border ${
                  verificationResult.passed 
                    ? 'bg-emerald-500/20 border-emerald-500/30' 
                    : 'bg-red-500/20 border-red-500/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {verificationResult.passed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <X className="w-5 h-5 text-red-400" />
                  )}
                  <span className={`font-semibold ${
                    verificationResult.passed ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {verificationResult.passed ? 'Challenge Completed!' : 'Challenge Failed'}
                  </span>
                </div>
                <p className="text-slate-300 text-sm mb-3">{verificationResult.feedback}</p>
                {verificationResult.passed && (
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Zap className="w-4 h-4" />
                    <span className="font-semibold">+{verificationResult.points} points earned!</span>
                  </div>
                )}
                <Button
                  onClick={handleComplete}
                  className="w-full mt-3 bg-gradient-to-r from-cyan-500 to-blue-500"
                >
                  Continue Exploring
                </Button>
              </motion.div>
            ) : (
              <>
                {/* Media Preview */}
                {mediaPreview && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative"
                  >
                    {hexagon.challenge_type === 'video' ? (
                      <video
                        src={mediaPreview}
                        controls
                        className="w-full rounded-lg bg-slate-800"
                      />
                    ) : (
                      <img
                        src={mediaPreview}
                        alt="Challenge submission"
                        className="w-full rounded-lg bg-slate-800"
                      />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setMediaFile(null);
                        setMediaPreview(null);
                      }}
                      className="absolute top-2 right-2 bg-slate-900/80 hover:bg-slate-800"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </motion.div>
                )}

                {/* Camera View */}
                {isCameraOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative"
                  >
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full rounded-lg bg-slate-800"
                    />
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                      <Button
                        onClick={captureMedia}
                        className="bg-red-500 hover:bg-red-600 text-white rounded-full w-16 h-16"
                      >
                        <Camera className="w-6 h-6" />
                      </Button>
                      <Button
                        onClick={stopCamera}
                        variant="ghost"
                        className="bg-slate-900/80 hover:bg-slate-800 text-white"
                      >
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Upload Options */}
                {!mediaPreview && !isCameraOpen && (
                  <div className="space-y-3">
                    <Button
                      onClick={startCamera}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Use Camera
                    </Button>
                    
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="w-full border-slate-600 hover:bg-slate-800"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload File
                    </Button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={hexagon.challenge_type === 'video' ? 'video/*' : 'image/*'}
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                )}

                {/* Submit Button */}
                {mediaFile && !verificationResult && (
                  <Button
                    onClick={submitChallenge}
                    disabled={isUploading || isVerifying}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : isVerifying ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        AI Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Submit Challenge
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Documentation Files

### README.md
```markdown
# Base44 App

This app was created automatically by Base44.
It's a Vite+React app that communicates with the Base44 API.

## Running the app

```bash
npm install
npm run dev
```

## Building the app

```bash
npm run build
```

For more information and support, please contact Base44 support at app@base44.com.
```

### BACKEND_INTEGRATION.md
```markdown
# Backend Integration Guide

## Quick Setup

This Exploragon frontend is now set up as a standalone Next.js app. Your friend can easily integrate their backend.

## File Structure

```
app/                 # Next.js App Router pages
├── page.js         # Home page (redirects to map)
├── map/page.js     # Map page
├── leaderboard/page.js  # Leaderboard page
└── profile/page.js # Profile page

src/
├── lib/data.js     # Local data layer (REPLACE WITH YOUR API)
├── pages/          # React components (reused from original)
├── components/     # UI components
└── api/            # Data interfaces
```

## Backend Integration Steps

### 1. Replace Local Data Layer
Replace `/src/lib/data.js` with your API calls:

```javascript
// Example: Update src/lib/data.js
export const Hexagon = {
  async list() {
    const response = await fetch('/api/hexagons')
    return response.json()
  },
  // ... other methods
}
```

### 2. Update API Endpoints
The app expects these data models:

**Hexagon:**
- `id`, `hex_id`, `location_name`, `challenge_title`
- `challenge_description`, `challenge_type`, `difficulty`
- `point_value`, `center_lat`, `center_lng`, `is_landmark`
- `boundary_coords` (array of lat/lng pairs)

**Submission:**
- `id`, `hexagon_id`, `media_url`, `media_type`
- `verification_status`, `points_awarded`, `created_by`

**User:**
- `id`, `email`, `full_name`, `created_date`

### 3. Replace Mock Integrations
Update `/src/api/integrations.js`:
- Replace `UploadFile` with your file upload endpoint
- Replace `InvokeLLM` with your AI verification service

## Running the App

```bash
# Use the clean Next.js package.json
mv package-nextjs.json package.json

# Install dependencies
npm install

# Start development server
npm run dev
```

## Easy Backend Swap

All data calls go through:
- `src/lib/data.js` - Main data layer
- `src/api/entities.js` - Data model exports
- `src/api/integrations.js` - External services

Just replace these 3 files with your API client and you're done!
```

---

## Key Features & Architecture

### Technology Stack
- **Frontend**: React 18 with Vite
- **UI Framework**: Tailwind CSS + Shadcn/ui components
- **Routing**: React Router DOM
- **Maps**: React Leaflet for interactive mapping
- **Animation**: Framer Motion
- **State Management**: React hooks (useState, useEffect)
- **Data Storage**: Local storage (can be replaced with API)

### Core Functionality

1. **Interactive Map**: 
   - Hexagon-based challenge locations
   - Real-time location tracking
   - Click-to-select hexagon challenges

2. **Challenge System**:
   - Photo/video capture or upload
   - AI-powered verification (mocked)
   - Point-based scoring system

3. **User Features**:
   - Profile with stats and achievements
   - Leaderboard with ranking system
   - Progress tracking

4. **Data Models**:
   - Hexagons (locations with challenges)
   - Submissions (user challenge attempts)
   - Users (player profiles and authentication)

### API Integration
The app is designed to work with Base44 SDK but includes a complete local data layer that can be easily replaced with any backend API. All data operations are abstracted through entity classes that can be swapped for real API calls.

---

## Development Notes

This is a complete, working location-based challenge game that demonstrates:
- Modern React development patterns
- Responsive design with mobile support  
- Real-time location services
- File upload and media handling
- Interactive mapping with custom overlays
- Component-based architecture with reusable UI elements

The codebase is well-structured for both development and backend integration, with clear separation between UI components, data layer, and business logic.