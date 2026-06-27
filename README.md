# Connoisseur Fashions — Garment Tracking System

A full-stack garment bundle tracking system with a web dashboard for managers and a mobile app for floor operators.

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express 5 + MongoDB (Mongoose) |
| Web | React 19 + Vite + React Router v7 |
| Mobile | Expo 56 + React Native 0.85 |
| Auth | JWT (2 roles: manager / operator) |

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18 or higher | https://nodejs.org |
| MongoDB | 6+ (local) | https://www.mongodb.com/try/download/community |
| Java JDK | 17 (for APK build) | `sudo apt install openjdk-17-jdk` |
| Android SDK | API 34+ (for APK build) | Android Studio or sdkmanager |
| Expo Go | Latest | Play Store / App Store (for device preview) |

> MongoDB must be running before starting the backend.  
> Start it with: `sudo systemctl start mongod`  
> Or run: `mongod --dbpath /data/db`

---

## Quick Start — Development

### 1. Backend

```bash
cd backend
npm install
npm run seed        # create demo users, styles, bundles (run once)
npm run dev         # API server → http://localhost:5000
```

### 2. Web Dashboard (Manager)

```bash
cd web
npm install
npm run dev         # → http://localhost:5173
```

Login credentials:
```
manager@connoisseur.com   / password123   (role: manager)
operator1@connoisseur.com / password123   (role: operator)
```

### 3. Mobile App (Operator) — Dev Preview

```bash
cd mobile
npm install
npx expo start
```

- Press **`a`** — open in Android emulator
- Press **`w`** — open in browser
- **Scan QR** with Expo Go app on your phone (phone and PC must be on same Wi-Fi)

---

## Production Build

### Web — Static Build

```bash
cd web
npm run build
# Output: web/dist/
```

Serve the `dist/` folder with any static host:
```bash
# Local preview
cd web && npx serve dist

# Nginx example
# Copy web/dist/ → /var/www/html/
```

---

### Mobile — Android APK Build

#### Step 1 — Install dependencies

```bash
cd mobile
npm install
```

#### Step 2 — Generate native Android project

```bash
npx expo prebuild --platform android --no-install
```

This creates the `mobile/android/` folder with the full native project.

#### Step 3 — Point Gradle to your Android SDK

```bash
echo "sdk.dir=$HOME/Android/Sdk" > mobile/android/local.properties
```

> Change the path if your SDK is installed elsewhere.  
> Find it in Android Studio: **SDK Manager → Android SDK Location**

#### Step 4 — Build the APK

**Debug APK** (install directly on any device, no signing needed):
```bash
cd mobile/android
./gradlew assembleDebug
```

Output: `mobile/android/app/build/outputs/apk/debug/app-debug.apk`

**Release APK** (for distribution — requires a keystore):
```bash
# Create a keystore (one-time)
keytool -genkey -v -keystore connoisseur.keystore \
  -alias connoisseur -keyalg RSA -keysize 2048 -validity 10000

# Move it into android/app/
mv connoisseur.keystore mobile/android/app/

# Add signing config to mobile/android/app/build.gradle under android { ... }:
# signingConfigs {
#   release {
#     storeFile file('connoisseur.keystore')
#     storePassword 'YOUR_STORE_PASSWORD'
#     keyAlias 'connoisseur'
#     keyPassword 'YOUR_KEY_PASSWORD'
#   }
# }
# buildTypes { release { signingConfig signingConfigs.release } }

cd mobile/android
./gradlew assembleRelease
```

Output: `mobile/android/app/build/outputs/apk/release/app-release.apk`

#### Step 5 — Install APK on device

```bash
# Via USB (enable USB debugging on the phone first)
adb install mobile/android/app/build/outputs/apk/debug/app-debug.apk

# Or transfer the .apk file to the phone and open it
# (Enable: Settings → Security → Install from unknown sources)
```

---

### Mobile — EAS Cloud Build (alternative, no Android SDK needed)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to your Expo account (create free at expo.dev)
eas login

# Configure EAS
cd mobile
eas build:configure

# Build APK in the cloud
eas build -p android --profile preview
```

EAS downloads the APK link when done — no local Android SDK required.

---

## Rebuild After Code Changes

| What changed | Command to run |
|-------------|----------------|
| Backend code | Restart `npm run dev` (nodemon auto-restarts) |
| Web code | Vite HMR auto-updates in dev; run `npm run build` for new dist |
| Mobile JS only | Expo Metro auto-reloads; no rebuild needed |
| Mobile native code | Re-run `npx expo prebuild` + `./gradlew assembleDebug` |
| Added new npm package | `npm install` then `npx expo prebuild` + Gradle rebuild |

---

## Seed Data

| Type | Count | Details |
|------|-------|---------|
| Users | 3 | 1 manager + 2 operators |
| Styles | 3 | Classic Kurta (CK001), Formal Shirt (FS002), Casual Tee (CT003) |
| Bundles | 8 | Spread across Cutting → Stitching → Finishing → Packing |
| Stock items | 3 | Factory + dispatch balances |

**Demo bundle IDs for mobile scanning:**
```
CK001-B001   Cutting stage
CK001-B002   Stitching stage
FS002-B001   Stitching stage
CT003-B001   Cutting stage
```

Re-seed at any time (drops and recreates all data):
```bash
cd backend && npm run seed
```

---

## API Endpoints

```
POST   /api/auth/login                     login (manager + operator)
GET    /api/auth/profile                   own profile

GET    /api/styles                         list styles
POST   /api/styles                         create style (manager only)

GET    /api/bundles                        list bundles  ?status=wip&stage=cutting
GET    /api/bundles/:bundleId              get one bundle
GET    /api/bundles/:bundleId/qrcode       QR code PNG (300×300)
POST   /api/bundles                        create bundle (manager only)

POST   /api/transitions                    log stage transition (operator)
GET    /api/transitions/:bundleId/history  transition history

GET    /api/stock                          stock levels by location
POST   /api/stock/transfer                 transfer factory → dispatch (manager)
GET    /api/stock/movements                movement history

GET    /api/dashboard                      WIP + stock summary
GET    /api/health                         health check
```

---

## Project Structure

```
tracking/
├── backend/
│   ├── .env                    PORT, MONGODB_URI, JWT_SECRET
│   └── src/
│       ├── config/             DB connection
│       ├── controllers/        auth, style, bundle, transition, stock, dashboard
│       ├── middleware/         JWT auth, role guard
│       ├── models/             User, Style, Bundle, StageTransition, StockItem, StockMovement
│       ├── routes/             route definitions
│       ├── seed/               seed script
│       └── server.js
├── web/
│   ├── .env                    VITE_API_URL
│   └── src/
│       ├── api/                axios instance + per-resource helpers
│       ├── contexts/           AuthContext
│       ├── layouts/            DashboardLayout (sidebar)
│       └── pages/              Dashboard, Bundles, Styles, StockTransfer, QRCodes, Profile
├── mobile/
│   ├── app.json                Expo config, permissions, bundle ID
│   ├── babel.config.js
│   ├── metro.config.js
│   ├── android/                generated by expo prebuild (git-ignored)
│   └── src/
│       ├── api/                axiosInstance, auth/bundle/transition APIs
│       ├── contexts/           AuthContext (AsyncStorage)
│       ├── navigation/         Stack + Bottom Tab navigator
│       ├── screens/            Login, Scan, LogTransition, Profile
│       └── utils/              offlineQueue (AsyncStorage)
├── DECISIONS.md                architecture rationale
└── README.md
```

---

## Credentials

```
manager@connoisseur.com   / password123   role: manager
operator1@connoisseur.com / password123   role: operator
operator2@connoisseur.com / password123   role: operator
```
