### Installation
1. Install packages using `yarn`
1. Run the porject as `expo start`

### Configuration URL

URLs for CouchDB Database
`src/utils/databaseManager.js`

URL for Web App
`src/services/API.js`

### Development 
`expo start`
### Build the App
Build the app for android
`eas build -p android --profile preview `

`eas build:run -p android --latest`


# Versions
### 1.2.1 (10)
`https://docs.google.com/document/d/1xpcSGm7QH-MI-LEZBz7G-kiaLDiNANAL8mbTbWjaQgQ/edit`

### 1.2.2 (11)
`Updated help texts on the login and registration page`

### 1.2.3 (12)
`Allow users to have their issues saved after being assigned to another person`

### 1.2.4 (13)
`Allow user to have many locations and perform issues sync`

### 1.2.5 (14)
`Verify if user is active for let to navigate on the app`

### 1.2.6 (15)
`Fix query data reponse Axios for verify_account_on_couchdb function`

### 1.2.7 (16)
`Fix query data reponse Axios for verify_account_on_couchdb function by verifying unexists representative eadl before logout`

### 1.2.8 (17)
`Fix detail page bug by controlling resolution_files attribute`

### 1.3.0 (18)
`Fix and decrease files size during the backup`
`Display only files that the user has saved in the file synchronization section`
`Limit files/Audios to 3`

### 1.3.3 (19)
`Update the user profile by adding statistics, villages and personalizing the page`
`Set up a first page for statistics module`
`Make issue date and category fields required`
`Order issues list from most recent to least recent`
`Set up search issues feature`