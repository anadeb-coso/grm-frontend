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
EXPO_PUBLIC_MIS_BASE_URL_ENV='http://10.0.2.2:8000'
EXPO_PUBLIC_COUCHDB_BASE_URL_ENV='http://10.0.2.2:5984'
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