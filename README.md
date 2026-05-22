# CortiSense Web App (`cortisense-webapp`)

## Overview
CortiSense is a Vue 3 + Vite application organized with a domain-driven design (DDD) style. The project focuses on biometric monitoring and shift management to prevent medical burnout, keeping business concepts separated from UI and infrastructure concerns.

## Goals
- Show a practical front-end architecture with DDD-inspired layering.
- Keep domain concepts explicit (`entity`, `command`, `resource`, `assembler`, `store`).
- Provide a robust platform for managing medical staff profiles, clinical risks, and incident alerts.

## Tech Stack
- Vue 3
- Vite
- Pinia
- Vue Router
- Vue I18n
- PrimeVue + PrimeFlex + PrimeIcons
- Axios
- `json-server` for local mock API

## Project Structure (DDD-Oriented)
```text
src/
audit-compliance/
  domain/
  application/
  infrastructure/
  presentation/

clinical-risk/               # Clinical Risk context
  domain/model/              # MedicalStaffProfile, BiometricRecord
  application/               # Clinical Risk store
  infrastructure/            # API gateway
  presentation/              # Status and vitals views

incident-alert-management/   # Incident Alert context
  domain/
  application/               # Incident store
  infrastructure/
  presentation/              # Supervisor dashboards and alerts

shift-coordination/          # Shift Coordination context
  domain/
  application/
  infrastructure/
  presentation/              # Shift scheduling views

staff-recovery/
  domain/
  application/
  infrastructure/
  presentation/
  
subscriptions/
  domain/
  application/
  infrastructure/
  presentation/

iam/                         # IAM bounded context (Auth & Users)
  domain/                    # Domain model (entities, commands)
  application/               # Use-case orchestration (Pinia store)
  infrastructure/            # API, assemblers
  presentation/              # Views and route declarations

shared/                      # Shared cross-context concerns
  infrastructure/            # BaseApi, BaseEndpoint, http client
  presentation/              # Layout and language switcher
```

## Bounded Contexts

### IAM Context
Manages users, authentication, and invitations.
- Includes `LoginCommand`, `RegisterByInvitationCommand`, and `User` entity.
- Uses `useAuthStore` to orchestrate session states.

### Clinical Risk Context
Manages fatigue levels, stress, and vitals.
- Tracks `MedicalStaffProfile` and `BiometricRecord`.
- Uses `useClinicalRiskStore` to provide data to supervisor and medical staff views.

### Incident Alert Management Context
Handles anomalies and alerts.
- Uses `useIncidentStore` for supervisor dashboard operations.

### Shift Coordination Context
Handles medical staff work shifts to correlate them with fatigue levels.

### Shared Context
Provides reusable infrastructure and presentation utilities.
- `BaseApi` and `BaseEndpoint` centralize API interactions.
- UI elements like Layout and LanguageSwitcher live here.

## Layer Responsibilities

### Domain Layer
- Defines business concepts and invariants as plain JavaScript classes.
- Stays framework-agnostic (no Vue/HTTP code).

### Application Layer
- Coordinates behavior and state transitions through Pinia stores.
- Uses domain objects plus infrastructure services to execute workflows.

### Infrastructure Layer
- Talks to external services/APIs (e.g., Axios).
- Maps external payloads to internal models via assemblers.

### Presentation Layer
- Renders UI and handles user interactions.
- Calls store actions and reacts to state.

## Running the Project

### Prerequisites
- Node.js + npm installed.

### 1) Install dependencies
```bash
npm install
```

### 2) Start mock API server (`json-server`)
From the project root:
```bash
npm run mock
```
The server reads `mock/cortisense-db.json` and maps routes via `mock/routes.json`.
Runs on `http://localhost:3000/api/v1`.

### 3) Start the Vue app
In a separate terminal, from the project root:
```bash
npm run dev
```

### 4) Build for production
```bash
npm run build
```

## Environment Variables
Environment files included:
- `.env.development`
- `.env.production`

Main variables:
- `VITE_CORTISENSE_API_URL`
- `VITE_USERS_ENDPOINT_PATH`
- `VITE_MEDICAL_STAFF_ENDPOINT_PATH`

## Routing Notes
- Current router exposes routes based on roles: `admin`, `clinical_supervisor`, and `medical_staff`.
- The IAM authentication guard ensures only logged-in users with correct roles access their respective dashboards.

## API and Data Notes
- Local mock data handles biometric records, shifts, and staff profiles.

## Documentation
- Domain and architecture references:
    - `docs/class-diagram.puml`
    - `docs/user-stories.md`

## Recommended Development Practices
- Keep each feature inside its bounded context first; move to `shared` only when truly cross-context.
- Preserve layer boundaries (presentation does not call raw HTTP clients directly).
- Add or update docs when introducing new entities, commands, or use cases.

## License
See `LICENSE.md`.
