# ClearChat — Cross-platform app source

This is one ClearChat codebase. It builds desktop installers for Windows, macOS, and Linux, plus an installable web app (PWA) for supported browsers on Chromebook, iPhone, iPad, Android, and Samsung devices.

## Important: what each platform receives
- **Windows:** `ClearChat-Windows` artifact (`.exe` installer).
- **macOS:** `ClearChat-macOS` artifact (`.dmg` installer).
- **Linux:** `ClearChat-Linux` artifact (`.AppImage`).
- **Chromebook, iPhone/iPad, Android and Samsung:** `ClearChat-Web-PWA` artifact is the web app bundle. Host it on HTTPS, then use the browser's Install/Add to Home Screen feature. iOS/iPadOS use Safari's Share → Add to Home Screen. It is not a native App Store / Play Store package.

## Build and download
1. Upload all files from this ZIP into your GitHub repository, preserving folders and replacing matching files.
2. Commit to `main`.
3. Open Actions and wait for the platform jobs.
4. Download the artifact for your platform.

## Supabase setup for real online accounts
Create a Supabase project and run `supabase/schema.sql` in its SQL Editor. In GitHub repository Settings → Secrets and variables → Actions, add:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Only use the Supabase publishable/anon key in the client, never a service-role key. Without these secrets, the app can build but remains in demo/unconfigured mode.

## Known feature limits
This repairs relative asset loading for Electron (the prior blank window) and replaces the app icon with a calendar + phone design. The current React app is still a prototype: full shared messaging depends on configured Supabase and its database schema; shared voice messages, video calls, and server-scheduled notifications while the app is closed are not fully implemented. The PWA must be hosted over HTTPS for installability and service-worker behavior. The PWA can be used on phones and Chromebooks, but this workflow does not produce native iOS or Android store packages.


## Desktop email sign-in callback
The desktop build now registers the `clearchat://` protocol and requests email sign-in links that return to `clearchat://auth/callback`. In Supabase Dashboard → Authentication → URL Configuration, add this exact Redirect URL as an additional allowed URL:

`clearchat://auth/callback`

Keep the existing Netlify URL and wildcard too, so web sign-in continues to work. After adding the redirect, rebuild and reinstall the Windows artifact from a fresh GitHub Actions run. Test with a newly requested email link; old links still contain their original redirect.
