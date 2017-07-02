'use strict';

const Module = require('../../../bot/modules/Module');
const CommandRegister = require('./commands/Register');
const CommandRank = require('./commands/Rank');
const HookCompetitiveRank = require('./hooks/CompetitiveRank');


class ModuleOverwatch extends Module {
    constructor(bot) {
        super(bot, 'overwatch');

        this.register(new CommandRegister(bot));
        this.register(new CommandRank(bot));
        this.register(new HookCompetitiveRank(bot));
    }
}

module.exports = ModuleOverwatch;
