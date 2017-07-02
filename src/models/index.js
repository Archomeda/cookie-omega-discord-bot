'use strict';

const mongoose = require('mongoose');

const BattleNetAccountSchema = require('./BattleNetAccount');
const OverwatchStatsSchema = require('./OverwatchStats');


module.exports = {
    BattleNetAccount: mongoose.model('BattleNetAccount', BattleNetAccountSchema),
    OverwatchStats: mongoose.model('OverwatchStats', OverwatchStatsSchema)
};
