# Cookie Omega - Discord Bot
[![Dependency status](https://david-dm.org/Archomeda/cookie-omega-discord-bot.svg)](https://david-dm.org/Archomeda/cookie-omega-discord-bot)
[![Build status](https://travis-ci.org/Archomeda/cookie-omega-discord-bot.svg)](https://travis-ci.org/Archomeda/cookie-omega-discord-bot)

A Discord bot that's powering the Cookie Omega Discord server.
While this bot is technically designed for this Discord server, you can adapt it for your own use as well.
This bot uses [discord.js Commando-Plus](https://archomeda.github.io/discord.js-commando-plus) as backend.

## Features
The bot can do various tasks that helps the Discord server.
 - **Overwatch**
   - Discord Synchronization
     - Link Discord and Blizzard accounts
   - Competitive
     - Automatically posts competitive rank updates

### Available commands
You can type `!help` in any text channel to receive the list of available commands DM'd to you.
You can also type `!help <command>` - where `<command>` is the name of an available command - in order to receive more detailed information about a specific command.

## Usage
This bot is currently not publically available for invites. Instead, you have to run the bot for yourself.
There are two options: use Docker or set it up manually.
After installation, don't forget to edit the settings in the *config* folder (check *config/default.yml* for instructions).
The bot requires a reboot after every configuration change in this file.

### Docker
 - Have [Docker](https://docs.docker.com/engine/installation/) and [Docker Compose](https://github.com/docker/compose/releases) installed
 - Create a new folder (e.g. *cookie-omega-discord-bot*)
 - Run the following from within that folder:
   `wget -O - https://raw.githubusercontent.com/Archomeda/cookie-omega-discord-bot/master/install.sh | bash`
 - This will run [a script](install.sh) that sets up the environment for the bot to run in
 - Create and edit *config/local.yml*
 - Start the bot: `docker-compose up -d`

You can manipulate the state of the bot by running various `docker-compose` commands.
These commands have to be executed from within your chosen bot folder:
 - Suspend: `docker-compose pause`
 - Resume: `docker-compose unpause`
 - Restart: `docker-compose restart`
 - Stop and remove: `docker-compose down`
 - Start: `docker-compose up -d`

You can also run the bot without using Docker Compose, and directly using Docker instead.
The image on Docker Hub is called *[archomeda/cookie-omega-discord-bot](https://hub.docker.com/r/archomeda/cookie-omega-discord-bot/)*.

### Manual (linux)
 - The bot requires the software to be installed:
   - Node.js 8
   - MongoDB 3.4
 - Clone or download the zip of a specific version (or master if that isn't available)
 - Install the dependencies with your favorite package manager (e.g. `npm install`)
 - Run the bot (e.g. `npm start`, `./server.js` or `node server.js`)

If you are running the bot 24/7, it is recommended to have a process manager that monitors the bot's process (e.g. pm2 or systemd).

## Updating
**Note:** Always check if your config file needs updating by comparing [the default config file](config/default.yml) to your own local file.

### Docker
Run the following from within the bot folder:
```bash
docker-compose pull
wget https://raw.githubusercontent.com/Archomeda/cookie-omega-discord-bot/master/config/default.yml -O config/default.yml
docker-compose down
docker-compose up -d
```

### Manual (linux)
If you've used git, it's as easy as running `git pull` to update, otherwise download a new copy.
Afterwards, restart the bot.

## Contributing
You can always contribute, but it does not necessarily mean that every feature will be added.
Creating an issue explaining what kind of feature you want to add is probably better than wasting your time on a feature that might not be added. 

If you encounter a bug, please create an issue explaining with as much information as possible.
Other things like grammar and/or spelling errors are wanted as well.
