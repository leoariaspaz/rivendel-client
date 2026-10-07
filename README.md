# Conciliaciones — Frontend

Client for labor claim conciliators.
[Backend repo](https://github.com/leoariaspaz/rivendel) · [Case study](<url>)

## Live Demo

[Try the live demo](https://conciliaciones-demo.vercel.app/) — demo credentials available on request (reach out via [LinkedIn](https://www.linkedin.com/in/leonardo-arias-paz)).

![screenshot or GIF]

## Overview

This application is a client for labor claim conciliators, who manage claims, the parties involved, and the sponsoring counsels representing each party. Each claim involves two parties: the claimant and the respondent, each of which may be represented by a sponsoring counsel.
The system also handles user credentials and can optionally synchronize events with Google Calendar.

The visible functional domain on the UI can be summarized in the following areas:
- Authentication and session
- Registration of sponsoring counsels
- Registration of claim parties (respondents and claimants)
- Labor claims
- Settlement clauses
- User settings
- Google Calendar synchronization

The app is built as an administrative CRM/management platform for conciliations. It relies on a modular CRUD pattern, repositories per entity, and a user validation and navigation system. The most valuable and sensitive core of the business is concentrated in the claims module and its associated document generation.

## Tech Stack

- **Frontend**: React 19 + Vite
- **Routing**: `react-router-dom` v7
- **UI**: Bootstrap 5 + CSS modular local
- **Forms & rich text**: `@tiptap/*`, `pdfmake`, `dompurify`
- **Networking**: `axios`
- **Local state**: stores simples en módulos + contextos React
- **Notifications**: `react-toastify`
- **Utilities**: `dayjs`, `date-fns`, `driver.js`
- **Test**: `vitest` + `@testing-library/react` + `@testing-library/jest-dom`
- **Lint**: ESLint + plugin React + React Hooks + Prettier

## Architecture

```mermaid
flowchart LR
  subgraph frontend["<div style='font-size:20px; font-weight:bold; margin-top:10px;'>Frontend</div>"]
      web["🌐 Website"]
  end

  subgraph backend["<div style='font-size:20px; font-weight:bold; margin-top:10px;'>Backend</div>"]
      api["⚙️ API Server"]
      subgraph services["Servicios / Integraciones"]
          bank["🏦 Bank"]
          db[("🛢️️ Database")]
          google["📅 Google Calendar"]        
      end
  end

  web --> api
  api --> bank
  api --> db
  api --> google

%% Estilos de alto contraste
    style frontend fill:##d8ebdd,stroke:green,stroke-width:2px
    style backend fill:#dcdcdc,stroke:#000,stroke-width:1px
    style services fill:#dcdcdc,stroke:#000,stroke-width:1px
    style web fill:#ffffff,stroke:#333,stroke-width:2px
    style api fill:#d0d0d0,stroke:#333,stroke-width:2px
    style bank fill:#d0d0d0,stroke:#333,stroke-width:1px
    style db fill:#d0d0d0,stroke:#333,stroke-width:1px
    style google fill:#d0d0d0,stroke:#333,stroke-width:1px

    linkStyle default stroke:#2b6cb0,stroke-width:2px;
```

## Backend Communication & Authentication

### Base URL Configuration
* **Axios Client**: Centralized API instance configured with `withCredentials: true` so the browser automatically handles cross-domain cookies with every request.
* **Environment Setup**: Environment endpoints are managed via Vite using `VITE_API_BASE_URL`.

### Authentication Strategy & Silent Refresh
* **In-Memory Access Token**: Short-lived JWT stored strictly in memory (React Context/state) to mitigate XSS risks. Attached to outbound API requests via an Axios interceptor using `Authorization: Bearer <token>`.
* **Cross-Domain Session Handling**: Relies on browser-managed session cookies forwarded automatically on cross-domain requests without client-side JS manipulation.
* **Silent Refresh**: An Axios response interceptor monitors `401 Unauthorized` responses to automatically trigger a background token renewal (`/auth/refresh`), retrying failed requests once a new token is set in memory.

### Cold Start / Server "Wake-Up" Strategy
* **Cold-Start Handling**: Because the backend runs on a platform that spins down during periods of inactivity, initial requests may experience cold-start latency.
* **Initial Health Check**: On app boot, the frontend issues a preliminary ping to the backend to wake up the server instance before the user executes critical operations.
* **Resilience & Retries**: Displays a global loading state during boot and handles initial connection delays or transient `503 Service Unavailable` responses until the server is fully warm.

### Environment Variables
Create a `.env` or `.env.local` file in the root directory:

```env
VITE_API_BASE_URL=https://your-backend-api.com
```

## Key Technical Decisions

### 1. Form State via Custom Reducer Hook (`useReclamoForm`)
* **The "Why"**: The *Reclamos* module is the core domain of the platform. The form is highly domain-specific, featuring interdependent steps, conditional logic, dynamic document templates, and contextual validations. Instead of adding a heavy form library (e.g., `react-hook-form` or `formik`), a custom `useReducer` hook (`useReclamoForm`) was chosen to centralize complex state transitions into predictable, unit-testable action dispatches (`SET_FIELD`, `SUBMIT_START`, `SET_ERRORS`).
* **The Trade-off**: Writing custom validation schema evaluation, dirty-state tracking, and nested field updates requires more boilerplate and manual effort to prevent unnecessary re-renders. However, it eliminated external abstractions, providing fine-grained control over edge cases without fighting third-party form library mechanics.

### 2. Tiptap + Custom Document-to-PDF Pipeline
* **Why Tiptap**: Claim processing requires dynamic legal/administrative document generation. Tiptap (headless, built on ProseMirror) was selected because it decoupled rich text editing logic from UI constraints, making it easy to seamlessly embed custom placeholders, metadata tokens, and structured document structures into the editor.
* **Unidirectional Sync (Document ➔ `useReclamoForm`)**: 
  * The integration between the Tiptap editor and the form reducer operates **unidirectionally**. 
  * The Tiptap editor serves as the primary authoring workspace for the claim content. As the user edits or formats the document, Tiptap's `onUpdate` callbacks extract the HTML/JSON content payload and dispatch actions to `useReclamoForm` to keep the global form state updated and ready for submission.
* **PDF Pipeline**: Once verified, the document string is used to generate a PDF document using a dedicated server/client generation strategy that preserves formatting without breaking layout fidelity.

### 3. Onboarding Tour: Migration from `react-joyride` to `driver.js`
* **The React 19 Compatibility Wall**: `react-joyride` (and its underlying dependency `react-floater`) relied on legacy React internals and lifecycle methods that failed or produced runtime crashes/warnings when upgrading the project to React 19.
* **The Fix (`driver.js`)**: `driver.js` is framework-agnostic, lightweight, and operates directly on DOM elements rather than forcing deep React fiber integration. By wrapping `driver.js` in a lightweight custom React hook, the application achieved flawless element highlighting, step popovers, and smooth tour progression under React 19 with zero compatibility overhead.
* **Persistence via `localStorage`**: To keep the onboarding non-intrusive, completed or dismissed tours persist flag markers in `localStorage`, allowing user-guided interactive tours without storing UI tour state on the database.

### 4. Dynamic PDF Generation for Claim Resolutions
* **The "Why"**: Settlement and failure documents can't be generated from a single static template. Content and layout must adapt to the resolution type and to the number and type of parties involved in each claim, since a claim may resolve with one or several claimants and respondents, each requiring their own section in the document.
* **Conditional Signature Lines**: The PDF footer renders a signature line per party, but only when that party is physically present at the hearing. A party is considered absent — and excluded from the signature line — if either a WhatsApp number is registered for them or the *"Incomparece"* (non-appearance) checkbox is checked; the signature line appears only when neither condition is met. This keeps the generated document legally accurate without requiring a separate "attendance" data model.
* **Pipeline**: Once the claim data and document content are validated, they're passed through a dedicated server/client generation strategy (see Tiptap integration above) that assembles the correct template variant and preserves formatting without breaking layout fidelity.

### 5. Other Non-Obvious Architecture Choices
* **Entity Repositories over Direct Fetching**: API interaction is encapsulated within dedicated repository modules per entity (e.g., `ReclamosRepository`, `ConciliacionesRepository`). This decouples data fetching, caching, and transformation from React UI components, keeping CRUD operations reusable and dry across different views.
* **Entity-Coupled Validation Components**: Validation rules and UI inputs are tightly bound to domain entity components. While this optimized rapid iteration and direct feature building, it relies on disciplined repository patterns to prevent business logic duplication across forms.

## Features

- User authentication and session management
- Multi-user support, with each conciliator managing their own claims, parties, and counsels independently
- Registration and management of claim parties (claimants and respondents) and their sponsoring counsels
- Creation and tracking of labor claims, each with one or more claimants and respondents
- Drafting of settlement clauses for conciliation agreements
- PDF generation of claim resolutions, with document format and content
  adapted to the resolution type and the parties involved
- User profile and account settings
- Google Calendar synchronization for scheduling conciliation hearings
- Backend offline detection with automatic recovery
- Guided tour of the main sections

## Project Structure

```text
rivendel-client/
├─ docs/                                  # Technical documentation
├─ public/                                # Static assets
├─ src/
│  ├─ api/                                # HTTP / repositories
│  │  ├─ repositories/                   # Entities: parties, sponsoring counsels, claims, users, health, calendar
│  │  ├─ auth.repository.js              # Login, refresh, logout
│  │  ├─ constants.js                   # Global backend configuration
│  │  ├─ http.js                        # axios authHttp/publicHttp instances
│  │  ├─ interceptors.js                # JWT + refresh + backend status
│  │  └─ *.test.js                     # API/repository tests
│  ├─ auth/                              # Session initialization
│  │  ├─ auth.bootstrap.js              # Auth bootstrap on app start
│  │  ├─ auth.service.js                 # Stores/clears token and profile
│  │  └─ *.test.js
│  ├─ components/
│  │  ├─ AppGate/                       # Backend status gate
│  │  ├─ Auth/                          # Route guards
│  │  ├─ ClausulasAcuerdo/              # Settlement clause editor and templates
│  │  ├─ GoogleCalendar/                # Google Calendar OAuth connection
│  │  ├─ Grid/                          # Reusable listing and pagination
│  │  ├─ Layout/                        # Shell, nav, onboarding tour
│  │  ├─ Login/                         # Login form and handlers
│  │  ├─ Partes/                        # Claim parties CRUD
│  │  ├─ Patrocinantes/                 # Sponsoring counsels CRUD
│  │  ├─ Reclamos/                      # Claims CRUD and settlement records
│  │  ├─ SearchDialog/                  # General-purpose search
│  │  ├─ Shared/                       # Wrappers, icons, validation, base layout
│  │  └─ Users/                        # User profile
│  ├─ contexts/
│  │  ├─ Constants.jsx                  # Global contexts
│  │  ├─ BackendStatusProvider.jsx      # Backend status
│  │  └─ NotificationProvider.jsx       # Centralized toast notifications
│  ├─ dtos/
│  │  ├─ token.js                       # In-memory token
│  │  └─ userName.js                    # In-memory username
│  ├─ stores/
│  │  ├─ auth-status.js                 # Authenticated state
│  │  ├─ auth-resolution.js             # Initial auth resolution
│  │  ├─ backend-status.js             # Server status
│  │  ├─ calendar.js                   # Google Calendar state
│  │  └─ *.test.js
│  ├─ utils/
│  │  └─ navigation.js                  # Safe navigation for redirects
│  ├─ App.jsx                          # Main login entry point
│  ├─ main.jsx                         # App bootstrap and routes
│  ├─ setupTests.js                    # Global test configuration
│  └─ index.css                        # Global CSS
├─ .env.local / .env.production         # Environment variables
├─ eslint.config.js                     # ESLint
├─ index.html                           # Vite base HTML
├─ package.json                         # Scripts and dependencies
├─ pnpm-lock.yaml                       # Lockfile
├─ vite.config.js                       # Build and test config
├─ README.md                            # Project documentation (this file)
├─ vercel.json                           # Deployment config
└─ test.sh                              # Project validation script
```

## Getting Started

### Prerequisites
- Node version, package manager

### Installation
```bash
git clone <repo>
cd <repo>
pnpm install
```

### Environment Variables
`VITE_BACKEND_URL=`

### Running locally
```bash
pnpm dev
```

## Testing

The test suite (58 files) covers three levels, all run with **Vitest** in a `jsdom` environment:
- **Unit tests:** functions, utilities, stores, services and repositories, tested in isolation.
- **Component tests:** React components and hooks via Testing Library, including forms, routes and dialogs.
- **UI integration tests:** interactions between components and in-app flows; repositories/API calls are mocked, so these don't hit the real  backend.

There's currently no E2E suite (e.g. Playwright/Cypress) running against a real browser.

**Coverage:** 86% statements · 82% functions · 86% lines · 75% branches

```bash
pnpm test           # run once
pnpm test:watch     # watch mode
pnpm test -- --coverage   # generate coverage report
```

## Related Repository

This is the frontend half of a full-stack project. [Backend](https://github.com/leoariaspaz/rivendel) (NestJS + Prisma + MySQL). 

## Roadmap

These items are out of scope for the current MVP but represent natural next steps for the product:

- ARCA invoicing for settlement agreements processed in a given period.
  - Requires linking the user's account to their ARCA account (ARCA is Argentina's federal tax collection agency).
  - Each conciliation — whether settled or failed — has an associated amount based on its resolution type.
  - Each claim included in an invoice should be marked as processed, with the related invoice number attached.
  - Generated invoices should be stored, including invoice number, date, total amount, and description.

- Document management for conciliation-related files.
  - Sponsoring counsels and their parties submit documentation related to the conciliation, such as powers of attorney, salary settlement statements, and formal notices (telegrams).
  - This documentation could be stored in Google Drive folders linked to the corresponding claim.
  - This would require linking the user's account to their Google Drive.

- Increase coverage of the existing test suite and add E2E tests.

- Add caching (e.g. Redis) for database queries.

## License

This project is publicly available for viewing and educational purposes only.
No permission is granted to use, modify, or distribute this code without explicit authorization.
