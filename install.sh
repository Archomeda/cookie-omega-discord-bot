#!/usr/bin/env bash

wget https://raw.githubusercontent.com/Archomeda/cookie-omega-discord-bot/master/.docker/docker-compose.yml -O docker-compose.yml
wget https://raw.githubusercontent.com/Archomeda/cookie-omega-discord-bot/master/.docker/.env -O .env

mkdir config
wget https://raw.githubusercontent.com/Archomeda/cookie-omega-discord-bot/master/config/default.yml -O config/default.yml

mkdir storage

docker-compose pull
