# Trip Planner Mobile

Expo + React Native mobile app for Trip Planner.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy env template:
```bash
cp .env.example .env
```

3. Fill env values:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_UNSPLASH_ACCESS_KEY` (for visual photo search in trip editor)

4. Start Expo:
```bash
npm run start
```

5. Run on device/simulator:
```bash
npm run ios
npm run android
npm run web
```

## Supabase Auth Redirect

Add this redirect URL in Supabase Auth settings:
- `plnr://auth-callback`

## Local Android Build (No EAS Cloud Usage)

Build APK locally with Gradle:

```bash
npx expo prebuild -p android
cd android
./gradlew assembleDebug
```

Debug APK output:
- `android/app/build/outputs/apk/debug/app-debug.apk`

Release APK (requires signing config):

```bash
cd android
./gradlew assembleRelease
```

Release APK output:
- `android/app/build/outputs/apk/release/app-release.apk`

Local run without packaging APK:

```bash
npx expo run:android
```
