---
name: hall-app
description: >-
  Expo SDK 56 mobile student app for RUET Hall Management. Use when working on
  hall-app/ — native navigation, auth, theme, API services, and feature parity
  with web/ student portal.
---

# Hall App — Mobile Student Portal

Full agent rules: `hall-app/AGENTS.md`. Architecture overview: repo root `LLM_CONTEXT.md`.

## Quick reference

| Topic | Detail |
|-------|--------|
| Stack | Expo SDK 56, RN 0.85, expo-router, react-native-keyboard-controller |
| Parity | Same backend modules as `web/` — auth, dining, admission, finance, inventory, profile |
| Navigation | Bottom tabs (Home, Dining, Pay, Profile) + stack for Admission, Report Damage, Settings |
| Auth | Bearer `sessionId` in SecureStore; parsed from login `Set-Cookie` |
| Theme | `ThemeContext` — `system` \| `light` \| `dark`; persisted in AsyncStorage |
| API URL | `EXPO_PUBLIC_API_URL` → `{host}:8000/api` |

## Key files

| File | Purpose |
|------|---------|
| `src/lib/api.ts` | Fetch client, 401 handler, Bearer auth |
| `src/lib/auth-storage.ts` | SecureStore session + user cache |
| `src/contexts/AuthContext.tsx` | Login/logout, profile hydration |
| `src/contexts/ThemeContext.tsx` | Theme preference + resolved colors |
| `src/components/system-chrome.tsx` | Status bar + Android navigation bar sync |
| `src/components/screen.tsx` | Keyboard-aware scroll wrapper |
| `src/app/(app)/(tabs)/_layout.tsx` | Native bottom tab bar |

## Do / Don't

- **Do** use Material-style bottom tabs and native stack headers.
- **Do** use `Screen` for scrollable forms with keyboard handling.
- **Do** mirror web service paths under `src/lib/services/`.
- **Don't** add sidebar navigation or web-style layouts.
- **Don't** use httpOnly cookies — mobile uses Bearer token only.

## Env (root `.env`)

```bash
EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:8000/api
```

Physical device must reach backend on LAN IP, not `localhost`.
