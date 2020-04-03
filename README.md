Chillhop MP3 Server Demo
========================

A demonstration project for Chillhop showcasing a possible structure and functionality of a new Radio Server.
The project is written in NodeJS and requires a SQL database.

## Installation instructions

### Install project dependencies
```sh
npm install
```
***Tip***: The installer will prompt and create .env variable automatically. If the installer fails to dispatch the postinstall hook, you can run it manaully by issuing `npm run postinstall`

### Prepare SQL database
Currently the project supports MySQL or MariaDB database, the support can be broadened by installing appropriate database drivers (check http://knexjs.org/ for further details).
The demo database structure is available in `./sql`

### Configure project
Create a configuration JSON file in `./config/env/<NODE_ENV>.json` that will override settings in `./config/default.json`.
***Example***: To set up basic database credentials in a project with `NODE_ENV=development`, the new `./config/env/development.json` configuration can look like this:
```json
{
    "database": {
        "user": "username",
        "password": "password"
    }
}
```

### Build project
```sh
npm build
```

## Basic usage
### Starting the project
```sh
npm run start
```
***Tip***: To start the project in different environments, you can use `npm run start-development` or `npm run start-production` commands.

### Server API
Server exposes basic API endpoints, such as
**GET**
`api/radios/` - Request list of available radios
`api/playlist/:id` - Request playlist of a specific radio
`api/current_track/:id` - Request currently playing track of a specific radio
`api/current_track_text/:id` - Request currently playing track text of a specific radio

**POST**
`api/update_playlist` - Create or update a radio playlist
`api/track` - Upload new track to the server

***Tip***: Advanced API documentation in a comprehensive ApiDoc format can be found within `./controllers/api.controller.ts` file.

## Other commands
### Re-run the postinstall hook
```
npm run postinstall
```
### Build and watch for code changes
```
npm run build-watch
```
### Run lint
```
npm run lint
```
