# GRM Frontend (MGP TG)

L'application **MGP** (Mécanisme de Gestion des Plaintes) est une application mobile de gestion et de suivi des plaintes collectées sur le terrain. Elle offre une vue globale des incidents/problèmes liés au projet COSO et facilite l'échange entre les collaborateurs pour qu'ils soient à l'écoute des incidents survenus sur le terrain.

L'application fonctionne en mode **hors-ligne d'abord (offline-first)** : les agents de terrain peuvent enregistrer, consulter et faire évoluer des plaintes sans connexion, la synchronisation avec le serveur se faisant automatiquement dès qu'une connexion réseau est disponible. Elle communique avec le backend `grm-backend` (Django/PostgreSQL) via le protocole de synchronisation [`@nozbe/watermelondb`](https://watermelondb.dev/), ainsi qu'avec les plateformes DCC et SIG pour le suivi des sous-projets, des activités de terrain et des données administratives.

### Installation
1. Install packages using `yarn install` or use this command to clean all caches and install the packages `yarn clean:android:full` for android
1. Run the porject as `yarn android`

### Configuration .env file on the racine of the project

```
EXPO_PUBLIC_GOOGLEMAPS_APIKEY_ENV=''
EXPO_MAPBOX_ACCESS_TOKEN_ENV=''
EXPO_PUBLIC_ANDROID_VERSION_CODE_ENV=
EXPO_PUBLIC_VERSION_ENV=""
EXPO_PUBLIC_PACKAGE_ENV=""

EXPO_PUBLIC_CDD_BASE_URL_ENV='http://10.0.2.2:8001'
EXPO_PUBLIC_GRM_BASE_URL_ENV='http://10.0.2.2:8002'

EXPO_PUBLIC_DIAGNOSTIC_MAP_LATITUDE_ENV=
EXPO_PUBLIC_DIAGNOSTIC_MAP_LONGITUDE_ENV=

EXPO_PUBLIC_CDD_PLAYSTORE_URL_ENV=
EXPO_PUBLIC_GRM_PLAYSTORE_URL_ENV=
ENVIRONMENT=
EXPO_PUBLIC_GRM_DB_NAME_ENV=''

```

### Build the App
Clean first (on windows) : `cd android && .\gradlew clean && cd ..`
Build the app for android (on windows) : `cd android && .\gradlew assembleRelease && cd ..`
You'll see the apk on `\android\app\build\outputs\apk`

# Versions
### 1.2.1 (10)
- `https://docs.google.com/document/d/1xpcSGm7QH-MI-LEZBz7G-kiaLDiNANAL8mbTbWjaQgQ/edit`

### 1.2.2 (11)
- `Updated help texts on the login and registration page`

### 1.2.3 (12)
- `Allow users to have their issues saved after being assigned to another person`

### 1.2.4 (13)
- `Allow user to have many locations and perform issues sync`

### 1.2.5 (14)
- `Verify if user is active for let to navigate on the app`

### 1.2.6 (15)
- `Fix query data reponse Axios for verify_account_on_couchdb function`

### 1.2.7 (16)
- `Fix query data reponse Axios for verify_account_on_couchdb function by verifying unexists representative eadl before logout`

### 1.2.8 (17)
- `Fix detail page bug by controlling resolution_files attribute`

### 1.3.0 (18)
- `Fix and decrease files size during the backup`
- `Display only files that the user has saved in the file synchronization section`
- `Limit files/Audios to 3`

### 1.3.3 (19)
- `Update the user profile by adding statistics, villages and personalizing the page`
- `Set up a first page for statistics module`
- `Make issue date and category fields required`
- `Order issues list from most recent to least recent`
- `Set up search issues feature`

### 1.5.0 (20)
- `Update projet to Expo 51 and Eject`
- `Assignment of the registered issue to the reporter automatically`
- `Ask to synchronize attached files when saving or adding files`
- `Alert on unsynchronized files`
- `Customizing the display of user statistics`
- `Retrieval and updating of data (issues) only related to the logged in user, with the exception of a user operating throughout the national territory`
- `Password change`
- `Password reset`

### 1.5.1 (21) : 2026.01.25
- `Change subdomain "cosomis-2.eba-mxictqba.us-west-1.elasticbeanstalk.com" to "sig.coso-togo.com" to apply secure https option`
- `Change subdomain "cdd-env.eba-mz2nppu7.us-west-1.elasticbeanstalk.com" to "dcc.coso-togo.com" to apply secure https option`
- `Change subdomain "grm-2-env.eba-speiyafz.us-west-1.elasticbeanstalk.com" to "mgp.coso-togo.com" to apply secure https option`

### 1.5.2 (22) : 2026.05.18
- `Added internet connection verification when calling certain functions`

### 2.5.0 (23) : 2026.08.05
- `Migrated the local database and data sync engine from PouchDB/CouchDB to WatermelonDB (SQLite), synchronized with the new PostgreSQL backend (grm-backend) via a dedicated pull/push REST protocol`
- `Replaced direct CouchDB replication with an explicit sync manager (watermelonSyncManager): frequent auto-sync while the app is in the foreground, spaced-out sync in the background, and a manual "sync now" trigger, all guarded against concurrent/duplicate synchronizations`
- `Added a global sync progress bar, visible on every screen, replacing the previous "synchronizing..." toast`
- `Added automatic detection and handling of devices that are too far behind to sync incrementally: the app now clears its local database and performs a full resync from the server, with a progress indicator while the user waits`
- `Added a dedicated, separately-scheduled synchronization for administrative levels (villages/cantons/préfectures/régions), refreshed once a day instead of on every sync`
- `Reworked attachment (photo/audio/PDF) handling: files are now uploaded/downloaded through independent queues, decoupled from the data sync flow`
- `Attachments are now downloaded on demand (via an explicit user action) instead of being auto-downloaded in bulk on every sync, to save data on limited connections`
- `Added a fullscreen attachment viewer (images and PDFs) that displays remote files directly, without requiring them to be downloaded first`
- `Added automatic compression of photos and audio recordings before upload to reduce data usage on the field`
- `Ensured consistent identifiers between mobile and server by generating UUIDs locally at record creation, so records created offline keep the same id once pushed to PostgreSQL`
- `Adopted JWT authentication (access/refresh tokens) with automatic token refresh and secure storage`
- `Added a server health/connectivity check to avoid failed sync attempts and give clearer feedback when the backend is unreachable`
- `Updated all issue-related screens (reporting steps, issue detail, issue history, issue actions, issue search, comments) and related modules (budget allocation/log, participatory budgeting, subprojects, statistics, sync/attachments screens) to work against the new WatermelonDB models`
- `Added automated tests covering the new sync engine (pull/push, full resync, administrative levels sync, upload ordering)`

### 2.5.2 (24) : 2026.08.29
- `Fixed a sync deadlock on issue escalation: pushing an escalation whose attached file (PV) had not finished uploading no longer rolls back the issue update — the issue now reaches the server and the batch self-heals on the next sync cycle instead of retrying forever`
- `Fixed offline-created records never converging on the server: the backend now keeps the UUID generated locally at creation instead of assigning a new one, so a record and its later references (updates, escalation levels, reasons) stay linked`
- `Fixed retried "created" records that already exist server-side being rejected in a loop (duplicate internal_code): they are now updated in place`
- `Fixed partial issue updates (e.g. escalate flag / status only) being rejected with "field is required" errors when the batch did not carry every field`
- `Villages of a canton assigned to a facilitator are now synced down to the device, so the village field can be filled after selecting that canton`
- `Issues tracked by a CVGP committee member are now automatically reassigned (community facilitator → supervisor → safeguard) with a notification to the new assignee once the issue is escalated above the village level`
- `Issue notification emails now show the issue internal code instead of the tracking code`



## Devices commands to know

`adb devices`
`adb kill-server`
`adb start-server`
`emulator -list-avds`
<!-- `avdmanager delete avd -n emulator-5554` -->
`netstat -a -n | find "5554"`
`emulator -avd NomDeTonAVD -port 5554`
`set ANDROID_SERIAL=emulator-5554` windows
`ANDROID_SERIAL=emulator-5574` Linux/macOS
`yarn expo run:android --device emulator-5554`