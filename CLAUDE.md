# myExpenses v2 — Master Reference

## 1. PROJECT OVERVIEW

- **App name:** myExpenses v2
- **What it is:** Offline-first React Native expense tracker being transformed into a public product with auth, cloud sync, and payments
- **Stack:** React Native 0.81.5, Expo SDK 54, TypeScript, expo-router 6, expo-sqlite 16
- **Backend:** Supabase (Postgres + Auth + Edge Functions + Storage)
- **Payments:** RevenueCat + Apple/Google IAP
- **Build tool:** EAS Build
- **AI tooling:** Claude Code for all development
- **Expo app root:** `artifacts/hit-hash-ben-not/`

---

## 2. TARGET NICHES (priority order)

1. **Travel Nurses (US)** — primary, zero competitors, GSA per diem is the killer feature
2. **Digital Nomads (global)** — secondary
3. **Touring Musicians (global)** — tertiary

---

## 3. PRICING MODEL

- **Free tier:** 1 trip, 10 photos/month, 1 currency, 3 cost centres
- **Pro:** $7.99/month or $69/year, 7-day free trial
- **Payment:** RevenueCat + Apple/Google IAP (15% commission, Small Business Program)
- **Note:** No Stripe for in-app purchases — App Store policy requires IAP

---

## 4. ARCHITECTURE PRINCIPLES

- **Offline-first:** SQLite is always the source of truth, never replaced by Supabase
- **Cloud-enhanced:** Supabase mirrors SQLite for sync and backup
- **Sync strategy:** Last-write-wins by `updated_at` timestamp
- **Every table must have:** `local_id`, `updated_at`, `synced_at`, `deleted_at`, `user_id`
- **Webhooks:** Handled by Supabase Edge Functions — no separate server needed
- **Auth tokens:** Stored in `expo-secure-store` only, never AsyncStorage

---

## 5. CURRENT BUILD STATUS

### Week 1: COMPLETE
- Deleted dead `app/export.tsx` (root level duplicate)
- Cash reconciliation navigation confirmed working in `cash-wallet.tsx`
- Exchange rates API fixed to use exchangerate-api.com v6 with `EXCHANGE_RATE_API_KEY`
- Dependencies installed: `@supabase/supabase-js`, `expo-secure-store`, `expo-network`, `expo-background-fetch`, `expo-task-manager`, `date-fns`
- `services/supabase.ts` created with typed client and empty `Database` type

### Week 2: IN PROGRESS
- Building auth screens (UI only — Supabase credentials pending)
- Screens: welcome, sign-up, sign-in, forgot-password, onboarding

---

## 6. FOLDER STRUCTURE RULES

```
artifacts/hit-hash-ben-not/
├── app/
│   ├── (auth)/          — all authentication screens
│   ├── (tabs)/          — existing main app tabs
│   ├── (niche)/         — niche-specific screens (assignments, tours, location tracker)
│   └── (account)/       — profile, subscription, paywall, data export
├── services/            — all external integrations
│   ├── supabase.ts      — Supabase client (exists)
│   ├── auth.ts          — auth helpers (pending)
│   ├── revenuecat.ts    — RevenueCat integration (pending)
│   ├── gsa.ts           — GSA per diem API (pending)
│   └── storage.ts       — Supabase Storage helpers (pending)
├── context/
│   ├── AppContext.tsx    — existing global state
│   ├── ThemeContext.tsx  — existing theme
│   ├── AuthContext.tsx   — pending (Week 2, after Supabase connected)
│   └── SyncContext.tsx   — pending (Week 3)
├── db/
│   ├── database.native.ts — existing SQLite implementation
│   └── syncEngine.ts      — pending (Week 3)
└── supabase/
    └── functions/         — Edge Functions for webhooks (pending)
```

---

## 7. CODING RULES — FOLLOW EVERY SESSION

- **Read every relevant file before writing any code**
- One task at a time — never combine multiple features in one prompt
- Never modify files not listed in the current task
- Every new screen needs: loading state, error state, happy path
- `StyleSheet.create()` only — no inline styles
- Full TypeScript — no `any` anywhere
- Every new Supabase table must have RLS enabled before use
- Service role key **NEVER** in client code
- Auth tokens in `expo-secure-store` only — never AsyncStorage
- After every task: show complete file contents + test checklist

---

## 8. KEY FILES TO READ FOR CONTEXT

| File | Purpose |
|------|---------|
| `db/types.ts` | All TypeScript interfaces |
| `context/AppContext.tsx` | Global state — understand before modifying |
| `context/ThemeContext.tsx` | Colours and theme — use these always |
| `constants/colors.ts` | Full colour token definitions (light + dark) |
| `hooks/useColors.ts` | Hook that returns typed colour tokens |
| `components/ui/` | Existing UI components — use before creating new ones |
| `db/database.native.ts` | SQLite implementation — understand before any db changes |
| `app/(tabs)/_layout.tsx` | Existing tab navigation structure |
| `app/_layout.tsx` | Root layout — providers and Stack screens |
| `db/currencyNames.ts` | Currency code → full name map (31 currencies) |
| `db/types.ts` | `EXCHANGE_CURRENCIES` array — all supported currency codes |

---

## 9. ENVIRONMENT VARIABLES

| Variable | Usage |
|----------|-------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL (safe for client) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (safe for client) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Edge Functions only — never in client code** |
| `REVENUECAT_IOS_KEY` | `appl_XXXX` |
| `REVENUECAT_ANDROID_KEY` | `goog_XXXX` |
| `EXCHANGE_RATE_API_KEY` | exchangerate-api.com key |

---

## 10. FEATURE GATE REFERENCE

### Free tier limits (trigger paywall when exceeded)
- Trips: max 1 active
- Receipt photos: max 10/month
- Currencies: max 1
- Cost centres: max 3
- Cloud sync: Pro only
- PDF reports: Pro only
- Filtered Excel export: Pro only
- All niche features: Pro only

### Pro niche-specific features
| Niche | Pro Features |
|-------|-------------|
| Travel Nurse | GSA per diem calculator, assignments tracker, multi-state tax summary |
| Digital Nomad | Location sessions, country tax export, multi-currency dashboard |
| Touring Musician | Tours, show dates, per-show P&L |

---

## 11. 12-WEEK SPRINT OVERVIEW

| Phase | Weeks | Focus |
|-------|-------|-------|
| Phase 1 | 1–4 | Foundation — auth + cloud sync |
| Phase 2 | 5–8 | Payments + niche features |
| Phase 3 | 9–12 | Polish + App Store + launch |

### Phase 1 acceptance test
Sign up on Device A → add 3 expenses → see them on Device B.
Delete one → see it disappear on both.
Go offline for 30 min → add changes → reconnect → all changes sync.
