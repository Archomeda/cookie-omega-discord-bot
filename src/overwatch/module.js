const path = require('path');
const { Module } = require('discord.js-commando-plus');

class ModuleOverwatch extends Module {
    constructor(client) {
        super(client, {
            id: 'overwatch',
            commands: [
                new (require('./commands/overwatch/register'))(client),
                new (require('./commands/overwatch/rank-checker-channel'))(client),
                new (require('./commands/overwatch/overwatch'))(client)
            ],
            groups: ['overwatch'],
            workers: [
                new (require('./workers/rank-checker'))(client),
                new (require('./workers/rank-poster'))(client)
            ],
            commandsDirectory: path.join(__dirname, 'commands'),
            workersDirectory: path.join(__dirname, 'workers'),
            localizationDirectory: path.join(__dirname, '../../locales')
        });
    }
}

module.exports = ModuleOverwatch;
