# ACE Process Control Software — Prosoft V2

Modern React/TypeScript/Vite re-implementation of the LabVIEW-based ACE Process
Control Software developed by **Advanced Control Equipments**.

---

## Prerequisites

| Tool | Minimum version | Download |
|------|----------------|---------|
| Node.js | 18.x (LTS) | https://nodejs.org |
| npm | 9.x (bundled with Node) | — |

> **Electron packaging** will require additional tools (Electron Forge / Builder)
> added in a later phase.

---

## Quick Start — Development

```powershell
# 1. Install dependencies (first time only)
npm install

# 2. Start the development server
npm run dev
```

Open **http://localhost:5173/** in your browser.  
The application opens immediately at the main ACE home page.

---

## Project Structure

```
Prosoft_V2/
├── index.html                    # HTML entry point
├── src/
│   ├── main.tsx                  # React root mount
│   ├── App.tsx                   # Root component (title bar + routing)
│   ├── App.css                   # App shell layout
│   ├── config/
│   │   ├── constants.ts          # APP_TITLE, APP_TAGLINE, APP_VERSION ← edit here
│   │   └── menuData.ts           # Complete menu hierarchy ← edit here
│   ├── styles/
│   │   └── global.css            # CSS custom properties (colours, spacing)
│   └── components/
│       ├── MenuBar/              # Horizontal menu bar + cascading menus
│       ├── HomePage/             # Main home page layout
│       ├── InfoPanel/            # Reusable white information panel
│       ├── ProsoftCircle/        # SVG four-quadrant circle illustration
│       └── PlaceholderPage/      # "Module under development" page
├── vite.config.ts
└── tsconfig.json
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on localhost:5173 |
| `npm run build` | TypeScript check + production build to `dist/` |
| `npm run preview` | Serve the production build locally |

---

## Configuration

### Change the version number

Edit [`src/config/constants.ts`](src/config/constants.ts):

```ts
export const APP_VERSION = 'Version 1.0';
```

### Add or modify menu items

Edit [`src/config/menuData.ts`](src/config/menuData.ts).

Each menu item uses this shape:

```ts
interface MenuItem {
  id: string;        // unique identifier
  label: string;     // display text
  enabled: boolean;  // false = greyed out, still visible
  children?: MenuItem[];   // sub-menu items
  action?: string;         // future module/route key
}
```

Disabled items appear greyed-out but remain in the menu (matching the original).

### Change panel content

Open [`src/components/HomePage/HomePage.tsx`](src/components/HomePage/HomePage.tsx).  
The four panel content arrays are defined at the top of the file.

---

## Future Phases (out of scope for Phase 1)

- **Modbus RTU communication** — Delta DTB9696B temperature controller  
  Will be isolated in a dedicated `src/services/modbus/` layer.
- **Electron packaging** — Windows desktop installer via Electron Forge.
- **Individual trainer modules** — Replacing PlaceholderPage with real content.

---

## Acceptance Criteria Status (Phase 1)

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Runs on localhost | ✅ http://localhost:5173 |
| 2 | Main page resembles screenshot | ✅ |
| 3 | Six top-level menu categories | ✅ |
| 4 | Process Trainers cascading menu | ✅ |
| 5 | Basic Process Trainers — 11 entries | ✅ ACE 101–111 |
| 6 | Disabled entries greyed out | ✅ ACE 105, 107, 109 |
| 7 | Home page: heading, tagline, panels, circle, version | ✅ |
| 8 | Central graphic sharp and scalable | ✅ Pure SVG |
| 9 | Usable at 1024×600 and 1366×768 | ✅ |
| 10 | Placeholder actions work | ✅ |
| 11 | Reusable components + configurable menu data | ✅ |
| 12 | Build succeeds without errors | ✅ |
| 13 | Development instructions documented | ✅ This README |
