# React Native (Expo)

Use an Expo development build for full app behavior, including Supabase email
verification, password reset and deep-link redirects.

Prerequisites for Android on a PC:

- Node.js 20 or newer
- Android Studio
- Android SDK, platform tools and an Android emulator from Android Studio
- [Eclipse Temurin JDK 17](https://adoptium.net/temurin/releases/?version=17&package=jdk)

The Android SDK is not installed with `pip`.

On Windows, if Java installs to the default folder, set it for the current PowerShell
terminal with:

```powershell
$env:JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot"
$env:Path="$env:JAVA_HOME\bin;$env:Path"
```

From the `apps/mobile/` directory:

```bash
cd apps/mobile
npm install   # first time only
npx expo prebuild
npx expo run:android
npm run android:dev
```

`npx expo ...` runs the Expo CLI for the project, so a global Expo CLI install is not
required.

After the development build is installed on the emulator, future runs usually only need:

```bash
cd apps/mobile
npm run android:dev
#or
npm start
```

Expo Go can still be used for quick UI checks:

```bash
cd apps/mobile
npm start
```

Then press `a` for Android, `i` for iOS, or scan the QR code. Use the development build
for the complete auth and redirect flow.
