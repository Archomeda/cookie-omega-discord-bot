#!/usr/bin/env node
'use strict';

const Bot = require('./bot/Bot');
const ModuleOverwatch = require('./src/modules/overwatch');
const ModuleUtilities = require('./src/modules/utilities');

const bot = new Bot();
bot.addModule(ModuleOverwatch);
bot.addModule(ModuleUtilities);

(async function () {
    try {
        await bot.start();
    } catch (err) {
        console.error(err.message);
        console.info(err.stack);
        process.exit(err.errno);
    }
})();
