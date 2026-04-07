# Hit-hash-Ben-not — Expense Tracker App

## Overview
A fully offline Android expense tracker app built with Expo/React Native (SDK 54). Rebuilt from an original Kotlin/Jetpack Compose app with improved UI/UX, correct data model, and all original features.

## Architecture

### App
- **Framework**: Expo SDK 54 / React Native 0.81.5
- **Routing**: Expo Router (file-based)
- **Database**: expo-sqlite (v16, local SQLite, fully offline)
- **State**: React Context (AppContext) + React Query for server state
- **UI**: React Native StyleSheet, @expo/vector-icons (Feather)
- **Fonts**: Inter (400/500/600/700) via @expo-google-fonts/inter

### Project Structure
```
artifacts/hit-hash-ben-not/
├── app/
│   ├── _layout.tsx           # Root layout with providers (AppProvider, QueryClient, etc.)
│   ├── (tabs)/
│   │   ├── _layout.tsx       # Tab navigator (5 tabs: Expenses, Trips, Add, Exchanges, More)
│   │   ├── expenses.tsx      # Monthly expenses list with month navigator
│   │   ├── trip.tsx          # Trips list
│   │   ├── index.tsx         # Quick add hub + summary
│   │   ├── exchanges.tsx     # Currency exchange list
│   │   └── more.tsx          # Settings/Export/About
│   ├── add-expense.tsx       # Add general expense form
│   ├── edit-expense/[id].tsx # Edit/delete general expense
│   ├── add-exchange.tsx      # Add currency exchange form
│   ├── edit-exchange/[id].tsx# Exchange detail/delete
│   ├── add-trip.tsx          # Create new trip form
│   ├── trip/[id].tsx         # Trip detail with legs/hotels/receipts
│   ├── trip/[id]/add-leg.tsx    # Add travel leg
│   ├── trip/[id]/add-hotel.tsx  # Add hotel stay
│   ├── trip/[id]/add-receipt.tsx # Add trip receipt
│   ├── export.tsx            # CSV export (placeholder)
│   ├── budgets.tsx           # Budget management (placeholder)
│   └── scan-receipt.tsx      # Camera receipt scan (placeholder)
├── db/
│   ├── types.ts              # TypeScript interfaces for all entities
│   ├── database.native.ts    # SQLite CRUD implementation (Android/iOS)
│   └── database.web.ts       # In-memory stubs for web preview
├── context/
│   └── AppContext.tsx        # Global state with refresh functions
├── components/ui/
│   ├── AppHeader.tsx         # Shared header component
│   ├── AmountBadge.tsx       # Currency + amount display
│   ├── CategoryPill.tsx      # Expense category badge with colors
│   └── EmptyState.tsx        # Empty list state component
├── constants/
│   └── colors.ts             # Dark + light theme design tokens
└── hooks/
    └── useColors.ts          # Color scheme hook
```

## Data Model
- **GeneralExpense**: date, month, year, description, amount, currency, category, division, costCenter, notes, receiptPath
- **Travel**: name, purpose, startDate, endDate
- **Leg**: travelId, departure/arrival (date, hour, country, city), transport
- **Hotel**: travelId, checkIn, checkOut, hotelName, city, country, pricePerNight, currency, nights
- **TripReceipt**: travelId, date, description, amount, currency, category, division, costCenter, selfDeclaration, receiptPath, notes
- **Exchange**: date, fromCurrency, toCurrency, amountFrom, rate, amountTo, description
- **Budget**: category, month, year, amount, currency

## Expense Categories
MEALS, ACCOMMODATION, TRANSPORT, OFFICE_SUPPLIES, ENTERTAINMENT, COMMUNICATION, OTHER

## Currencies
ILS, USD, EUR, GBP, JPY, CHF, CAD, AUD, CNY, AED

## Design
- Dark theme: background #1C1C1C, card #2A2A2A, primary blue #3077FF, text #F3F3F3
- Light theme also defined (via useColors hook, follows system preference)
- Font: Inter (Replit-provided via @expo-google-fonts/inter)
- Border radius: 10px standard, 12-16px for cards

## Development Notes
- Web preview shows dark theme; mobile follows system preference
- expo-sqlite only works on native (Android/iOS); web uses `database.web.ts` with localStorage
- `database.web.ts` is a full localStorage implementation (not stubs) — includes all DB entities including CashWalletDB
- No backend — fully offline, data lives in local SQLite on device (localStorage on web)
- Tab bar uses NativeTabs (liquid glass) on iOS 26+, classic Tabs on Android/older iOS
- All add-* forms use `accessibilityLabel="close"` on the X button for testability
- `confirmDiscard()` in add-expense.tsx and edit-expense/[id].tsx uses `window.confirm()` on web (Alert.alert is a no-op stub on web)
- `handleDelete()` in edit-expense/[id].tsx uses `window.confirm()` on web
- Export screen uses `window.alert()` on web for "not supported" message (Alert.alert is a no-op stub on web)
- Delete button in edit-expense/[id].tsx has `accessibilityLabel="delete"` for testability

## Testing
- End-to-end test suite in `artifacts/hit-hash-ben-not/tests/full-user-flow.spec.ts`
- 32 tests covering all 6 expense subjects (receipts, hotel nights, exchanges, ATM, transfers, client transfers) + export flow + form validation + cancel/delete flows
- Run from repo root: `pnpm test` (runs `pnpm --filter @workspace/hit-hash-ben-not run test`)
- Uses system Chromium at `/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium-browser`
- All 32 tests pass in ~2 minutes

## Task Status
- [x] Task 1: Expo Scaffold & Branding — COMPLETE
- [ ] Task 2: General Data & Budget Management
- [ ] Task 3: Expenses Screen & Add Receipt Flow
- [ ] Task 4: Camera & Photo Attachment
- [ ] Task 5: Trip Data & Hotel Nights
- [ ] Task 6: Currency Exchange Screen
- [ ] Task 7: CSV Export & Data Validation
- [ ] Task 8: About Popup & Version Management
