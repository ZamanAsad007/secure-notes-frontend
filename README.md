# Secure Notes Client (Frontend SPA)

A modern, responsive Single Page Application (SPA) designed to Google Stitch Material Design 3 specifications. Built with React 19, Vite, and Tailwind CSS v4, supporting dynamic Light and Dark mode theming, owner-scoped note management, public feed publishing, and administrative consoles.

- **GitHub Repository**: [https://github.com/ZamanAsad007/secure-notes-frontend](https://github.com/ZamanAsad007/secure-notes-frontend)
- **Live Frontend Application**: `https://YOUR-APP.vercel.app` (Vercel)
- **Backend API Repository**: [https://github.com/ZamanAsad007/secure-notes-backend](https://github.com/ZamanAsad007/secure-notes-backend)
- **Live Backend API**: `https://YOUR-API.onrender.com` (Render Web Service)

---

## 🎨 Design & Features

- **Material Design 3**: Modern, accessible UI aligned with Stitch specifications (`2123888917444584757`).
- **Reactive Theming**: Full Light (`#faf9fd`) and Dark (`#121212`) palettes with instant switcher.
- **Top Bar Profile Menu**: Clean top navigation with interactive top-right avatar menu for theme toggling, profile editing, and secure session termination.
- **Interactive Authentication**: Tabbed SignIn/SignUp portal with one-click quick-fill buttons for demo credentials.
- **Vault Workspace**: Responsive 3-column note vault with search filtering, modal editor, character count indicators, and delete confirmation dialogs.
- **Encrypted Feed & Timeline**: Community post composer and interactive author discovery with cursor pagination.
- **Admin Consoles**: Administrative directories for managing user roles, inspecting note audits across owners, and viewing aggregation directories grouped by interest.

---

## 🛠️ Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite 8.x
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Icons**: Lucide React (`lucide-react`) & Material Symbols Outlined
- **Linting**: Oxlint

---

## ⚙️ Environment Variables

Create a `.env` file in the frontend root:

```env
VITE_API_URL=https://YOUR-API.onrender.com/api
```

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | Optional | `/api` | Base URL of the backend API. When left unset during local development, Vite proxies requests from `/api` to `http://localhost:5000`. Set this in production (e.g. on Vercel) to point to your live Render backend URL. |

---

## 🚀 Local Setup & Installation

### 1. Clone & Install
```bash
git clone https://github.com/ZamanAsad007/secure-notes-frontend.git
cd secure-notes-frontend
npm install
```

### 2. Configure Environment (Optional for local dev)
For local development against the local backend server on `http://localhost:5000`, no `.env` file is required because `vite.config.js` proxies `/api` requests directly to `http://localhost:5000`.

To test against a remote backend:
```bash
cp .env.example .env
# Edit VITE_API_URL with your remote API URL
```

### 3. Development Server
```bash
npm run dev
# Starts local Vite development server on http://localhost:5173
```

### 4. Production Build & Preview
```bash
npm run build
npm run preview
```

---

## 🔑 Demo Credentials

Use these credentials to log in (or click the quick-fill buttons on the SignIn page):

| Role | Email | Password | Clearance |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `AdminSecurePassword123!` | Full admin audit, user directory, and interest aggregation |
| **User** | `alice@example.com` | `Password123!` | Owner-scoped notes and timeline authoring |
| **User** | `bob@example.com` | `Password123!` | Owner-scoped notes and timeline authoring |

---

## ☁️ Deployment (Vercel)

1. Import the `secure-notes-frontend` repository into Vercel.
2. Select Framework Preset: **Vite**.
3. In **Environment Variables**, set:
   ```
   VITE_API_URL=https://<your-render-service>.onrender.com/api
   ```
4. Deploy! `vercel.json` is preconfigured to route all SPA URL paths to `index.html`.
