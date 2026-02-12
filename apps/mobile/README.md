# plnr.guide Mobile

Expo + React Native mobile app for plnr.guide.

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
- `EXPO_PUBLIC_AUTH_REDIRECT_URL` (recommended: `https://plnr.guide/auth-callback`)

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

Add these redirect URLs in Supabase Auth settings:
- `https://plnr.guide/auth-callback`
- `https://www.plnr.guide/auth-callback`
- `plnr://auth-callback` (fallback for non-universal-link flows)

## App / Universal Link Files

Host these files on your web domain:
- `https://plnr.guide/.well-known/assetlinks.json`
- `https://plnr.guide/.well-known/apple-app-site-association`

Before production, replace placeholders in those files:
- Android SHA256 cert fingerprint in `public/.well-known/assetlinks.json`
- Apple Team ID in `public/.well-known/apple-app-site-association`

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
