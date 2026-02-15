# Trading Calendar Journal

Offline mobile app for tracking daily trading results, quality metrics, and performance over time.
Built with React Native + Expo + SQLite. No backend, no login, no cloud — all data stays on your device.

## Features

- **Calendar View** — monthly calendar with color-coded days (green = profit, red = loss, gray = no data), trade count & R-result miniatures, breach badges
- **Day Editor** — full CRUD for daily entries: trades count, R result, PnL %, notes, quality checklist (held plan, out of setup, moved SL, revenge trade), trade times
- **Week Summary** — rolling 7-day stats: total R, total PnL %, green/red/gray days, avg trades/day, breach count, equity curve chart
- **Hour Heatmap** — visual 24h grid showing trade frequency by hour
- **Settings** — configurable max trades per day (breach threshold)

## Tech Stack

- Expo (Managed → Prebuild for APK)
- TypeScript
- expo-sqlite (local database)
- react-native-calendars
- react-native-chart-kit + react-native-svg
- React Navigation (native stack + bottom tabs)

## Project Structure

```
TradingJournal/
├── App.tsx                  # Entry point, navigation setup, DB init
├── app.json                 # Expo config (package: com.kacper.tradingjournal)
├── src/
│   ├── db/
│   │   ├── init.ts          # Database initialization, table creation
│   │   └── queries.ts       # All DB queries (CRUD for entries, times, settings)
│   ├── screens/
│   │   ├── CalendarScreen.tsx
│   │   ├── DayEditScreen.tsx
│   │   ├── WeekSummaryScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── components/
│   │   └── HourHeatmap.tsx
│   └── utils/
│       ├── date.ts          # Date formatting, validation
│       └── summaries.ts     # Week summary computation
├── assets/                  # Icons, splash screen
└── README.md
```

## Database Schema

```sql
day_entries (
  id INTEGER PK AUTOINCREMENT,
  date TEXT UNIQUE NOT NULL,     -- YYYY-MM-DD
  tradesCount INTEGER NOT NULL DEFAULT 0,
  rResult REAL,
  pnlPercent REAL,
  note TEXT,
  heldPlan INTEGER NOT NULL DEFAULT 0,
  outOfSetup INTEGER NOT NULL DEFAULT 0,
  movedSL INTEGER NOT NULL DEFAULT 0,
  revengeTrade INTEGER NOT NULL DEFAULT 0
)

trade_times (
  id INTEGER PK AUTOINCREMENT,
  dayDate TEXT NOT NULL,          -- FK → day_entries.date
  time TEXT NOT NULL              -- HH:MM
)

settings (
  key TEXT PK NOT NULL,
  value TEXT NOT NULL
)
```

---

## 1. Development (Expo Go)

### Prerequisites
- Node.js 18+ installed
- Expo Go app on your phone (from Google Play / App Store)

### Steps
```bash
cd TradingJournal
npm install
npx expo start
```

Scan the QR code with Expo Go (Android) or Camera app (iOS).

---

## 2. Build Release APK Locally (bez EAS, za darmo)

### Prerequisites

#### A) Java JDK 17
- Windows: Download from https://adoptium.net/temurin/releases/ (Temurin 17 LTS, .msi installer)
- After install, verify: `java -version` → should show 17.x

#### B) Android SDK
**Option 1 — Android Studio (recommended):**
1. Download Android Studio from https://developer.android.com/studio
2. Install. During setup, ensure "Android SDK" is checked.
3. Open Android Studio → Settings → Languages & Frameworks → Android SDK
4. Install SDK Platform: **Android 14 (API 34)**
5. In SDK Tools tab, ensure installed:
   - Android SDK Build-Tools 34
   - Android SDK Platform-Tools
   - Android SDK Command-line Tools

**Option 2 — Command-line only:**
1. Download Android command-line tools from https://developer.android.com/studio#command-line-tools-only
2. Extract to e.g. `C:\Android\cmdline-tools\latest\`
3. Run: `sdkmanager "platforms;android-34" "build-tools;34.0.0" "platform-tools"`

#### C) Environment Variables (Windows)
Add to System Environment Variables:
```
ANDROID_HOME = C:\Users\<USER>\AppData\Local\Android\Sdk
JAVA_HOME = C:\Program Files\Eclipse Adoptium\jdk-17...
```
Add to PATH:
```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
```

### Build Steps

```bash
# 1. Generate native Android project
npx expo prebuild --platform android

# 2. Go to android directory
cd android

# 3. Build release APK
# Windows (CMD):
gradlew.bat assembleRelease

# Windows (PowerShell):
.\gradlew.bat assembleRelease

# Linux/Mac:
./gradlew assembleRelease
```

### Where is the APK?

After successful build:
```
android/app/build/outputs/apk/release/app-release.apk
```

This file (~30-50 MB) can be sent directly to anyone for installation.

### AAB (for Google Play, optional)
```bash
gradlew.bat bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

---

## 3. Build via Android Studio (GUI alternative)

1. Run `npx expo prebuild --platform android` in the project root
2. Open Android Studio
3. File → Open → select the `android/` folder inside TradingJournal
4. Wait for Gradle sync to complete
5. Build → Generate Signed Bundle / APK
   - Select APK
   - Create a new keystore (or use debug) — for personal use, debug signing is fine
   - Select `release` build variant
   - Finish
6. APK will be in `android/app/release/`

---

## 4. Install APK on Phone

1. Copy `app-release.apk` to the phone (USB, email, Google Drive, etc.)
2. On the phone, go to **Settings → Security** (or **Apps → Special access**)
3. Enable **"Install from unknown sources"** for your file manager
4. Open the APK file and tap **Install**
5. Done! App icon "Trading Journal" appears in the launcher.

---

## 5. Build on Android (Termux) — experimental

```bash
# Install Termux from F-Droid
pkg install nodejs-lts openjdk-17 git

# Clone project, install deps
npm install

# Prebuild
npx expo prebuild --platform android

# You'll need Android SDK — this is the tricky part in Termux.
# Recommended: use a PC instead. Termux builds are fragile.
```

---

## Manual Test Checklist

### App Launch
- [ ] App starts without crash
- [ ] Loading spinner shown briefly, then calendar appears
- [ ] Bottom tabs visible: Calendar, Week, Settings

### Calendar Screen
- [ ] Monthly calendar renders correctly
- [ ] Swipe/arrow to change month works
- [ ] Days with no entries appear without color
- [ ] Tap on any day navigates to DayEditScreen
- [ ] After saving an entry, calendar shows correct color (green/red/gray)
- [ ] Trade count and R-result miniature text visible on calendar days
- [ ] Breach badge (orange "!") appears when tradesCount > maxTradesPerDay

### Day Edit Screen
- [ ] Date header shows the selected date (readonly)
- [ ] tradesCount defaults to "0" for new entry
- [ ] Can enter positive/negative R result (e.g., 1.5, -0.8)
- [ ] Can enter PnL % (e.g., 2.3, -1.1)
- [ ] Can type notes
- [ ] Quality checklist toggles work (held plan, out of setup, moved SL, revenge trade)
- [ ] Can add trade time in HH:MM format
- [ ] Invalid time (e.g., "25:00", "abc") rejected with alert
- [ ] Can remove individual trade times
- [ ] Save button creates/updates entry
- [ ] After save, going back to calendar shows updated day
- [ ] Delete button appears only for existing entries
- [ ] Delete removes entry and trade times
- [ ] Empty R result / PnL % saved as null (no crash)

### Week Summary Screen
- [ ] Shows stats for last 7 days
- [ ] Total R and Total PnL % calculated correctly
- [ ] Green/Red/Gray day counts match calendar
- [ ] Average trades/day shown
- [ ] Breach count matches days exceeding max trades
- [ ] Equity curve chart renders (or shows "no data" gracefully)
- [ ] Hour heatmap renders (24 hour cells)
- [ ] Heatmap intensity matches trade time frequency

### Settings Screen
- [ ] Max trades per day loads saved value (default: 2)
- [ ] Can change and save new value
- [ ] Validation: rejects negative or non-integer values
- [ ] After changing, calendar breach badges update accordingly
- [ ] App info section displays version and privacy note

### Data Persistence
- [ ] Close and reopen app — all saved entries persist
- [ ] Kill app from recents — data still there
- [ ] Works fully offline (airplane mode)

### Edge Cases
- [ ] New install with empty DB — no crash
- [ ] Calendar month with 0 entries — renders fine
- [ ] Week summary with 0 entries — shows zeros, chart shows flat line or "no data"
- [ ] Very long note text — no crash or layout break
- [ ] Multiple trade times for one day — all saved and shown
