const path = require('path');
const { Module } = require('discord.js-commando-plus');

class ModuleCookieOmega extends Module {
    constructor(client) {
        super(client, {
            id: 'cookie-omega',
            commands: [
                new (require('./commands/cookie-omega/info'))(client)
            ],
            groups: ['cookie-omega'],
            commandsDirectory: path.join(__dirname, 'commands'),
            localizationDirectory: path.join(__dirname, '../../locales')
        });
    }
}

module.exports = ModuleCookieOmega;
