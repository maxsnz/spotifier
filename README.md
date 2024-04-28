## Requirements:

Node >= 18

Postgress

Yarn 1.x

## Installation:

`yarn` - install yarn packages

## App commands:

`yarn start` - start server

`yarn dev` - start server in watch mode

## Docker commands:

### build container:

`docker build -t spotifier .`

### run container:

`docker run -d --name spotifier --network=host spotifier`

### list of containers:

`docker ps`

### container logs:

`docker logs spotifier`

### stop container:

`docker stop spotifier`

## Env vars:

`BOT_TOKEN` - telegram bot token

`SPOTIFY_CLIENT_ID` - spotify client id

`SPOTIFY_CLIENT_SECRET` - spotify client secret
