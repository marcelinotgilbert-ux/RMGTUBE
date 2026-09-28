# RMGTUBE

MVP RMGTUBE: Web + Android (Capacitor) + API Node/Express + SQLite.

## Logo
Le logo fourni est inclus dans `web/public/rmgtube-logo.png` et affiché sur la page de connexion, l'en-tête et le favicon Web.

## Build APK sans Android Studio
1. Créer un repository GitHub et mettre le contenu de ce dossier à la racine.
2. Aller dans **Actions**.
3. Choisir **Build RMGTUBE APK**.
4. Cliquer **Run workflow**.
5. Une fois terminé, ouvrir le run puis télécharger l'artifact **RMGTUBE-APK**.

Le workflow `.github/workflows/build-apk.yml` installe Node/Java/Android SDK, construit le Web et génère `app-debug.apk`.
