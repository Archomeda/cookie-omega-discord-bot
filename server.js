#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const commando = require('discord.js-commando-plus');
const filesize = require('filesize');
const i18next = require('i18next');
const merge = require('deepmerge');
const moment = require('moment-timezone');
const mongoose = require('mongoose');
const { oneLine } = require('common-tags');
const yaml = require('js-yaml');

const models = require('./src/models');

mongoose.Promise = global.Promise;

const config = merge(
    yaml.safeLoad(fs.readFileSync(path.join(__dirname, 'config/default.yml'))),
    yaml.safeLoad(fs.readFileSync(path.join(__dirname, 'config/local.yml'))),
    {
        arrayMerge: (destination, source) => source
    }
);

const client = new commando.Client({
    owner: config.owner,
    commandPrefix: '!'
});

let mongooseConn;

client
    .on('error', console.error)
    .on('warn', console.warn)
    .on('debug', console.log)
    .on('ready', () => {
        console.log(`Client ready; logged in as ${client.user.tag} (${client.user.id})`);
    })
    .on('disconnect', () => {
        console.warn('Disconnected!');
    })
    .on('reconnecting', () => {
        console.warn('Reconnecting...');
    })
    .on('commandError', (cmd, err) => {
        if (!(err instanceof commando.FriendlyError)) {
            console.error(`Error in command ${cmd.groupID}:${cmd.memberName}`, err);
        }
    })
    .on('commandBlocked', (msg, reason) => {
        console.log(oneLine`
			Command ${msg.command ? `${msg.command.moduleID}:${msg.command.groupID}:${msg.command.memberName}` : ''}
			blocked; ${reason}
		`);
    })
    .on('commandPrefixChange', (guild, prefix) => {
        console.log(oneLine`
			Prefix ${prefix === '' ? 'removed' : `changed to ${prefix || 'the default'}`}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
    })
    .on('commandStatusChange', (guild, command, enabled) => {
        console.log(oneLine`
			Command ${command.moduleID}:${command.groupID}:${command.memberName}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
    })
    .on('groupStatusChange', (guild, group, enabled) => {
        console.log(oneLine`
			Group ${group.id}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
    })
    .on('workerStatusChange', (guild, worker, enabled) => {
        console.log(oneLine`
			Worker ${worker.id}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
    });

async function stop() {
    if (client.ws.connection) {
        await client.destroy();
    }
    if (mongooseConn) {
        await mongoose.disconnect();
    }
    process.exit();
}

process.on('warning', e => {
    console.warn(`${e.name}: ${e.message}`);
    console.warn(e.stack);
});

process.on('SIGTERM', stop);
process.on('SIGINT', stop);

(async function () {
    try {
        await client.setLocaleProvider(new commando.I18nextLocaleProvider(i18next, undefined, {
            interpolation: {
                format: (value, format, lng) => {
                    if (value) {
                        switch (format) {
                            case 'duration':
                                return moment.duration(value).locale(lng).humanize();
                            case 'filesize':
                                return filesize(value);
                            default:
                                break; // Make linter happy
                        }
                    }
                    return value;
                },
                escape: s => s
            }
        }));
        await client.setSettingsProvider(new commando.YAMLSettingsProvider(path.join(__dirname, path.join('config', 'servers')))).catch(console.error);
        for (let i = 0; i < 10; i++) {
            try {
                // eslint-disable-next-line no-await-in-loop
                mongooseConn = await mongoose.createConnection(config.mongodb.uri, { reconnectTries: Number.MAX_VALUE });
                break;
            } catch (err) {
                console.log(err.message);
                if (i < 10) {
                    // eslint-disable-next-line no-await-in-loop
                    await new Promise(resolve => setTimeout(resolve, 5000));
                } else {
                    throw err;
                }
            }
        }
        await client.setStorageProvider(new commando.MongoStorageProvider(mongooseConn));
        client.storageProvider.registerModel('BattleNetAccount', models.BattleNetAccountSchema);
        client.storageProvider.registerModel('OverwatchStats', models.OverwatchStatsSchema);

        await client.registry.registerDefaults();
        await client.registry.registerModule(new (require('./src/cookie-omega/module'))(client));
        await client.registry.registerModule(new (require('./src/overwatch/module'))(client));

        await client.login(config.token);
    } catch (err) {
        console.error(err.message);
        console.info(err.stack);
        process.exit(err.errno);
    }
})();
