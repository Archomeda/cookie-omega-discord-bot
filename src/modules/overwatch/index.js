'use strict';

const Module = require('../../../bot/modules/Module');
const CommandRegister = require('./commands/Register');
const HookCompetitiveRank = require('./hooks/CompetitiveRank');


class ModuleOverwatch extends Module {
    constructor(bot) {
        super(bot, 'overwatch');

        this._onFire = false;

        this.register(new CommandRegister(bot));
        this.register(new HookCompetitiveRank(bot));
    }
}

module.exports = ModuleOverwatch;
