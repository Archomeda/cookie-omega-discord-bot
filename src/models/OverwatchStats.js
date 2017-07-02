'use strict';

const Schema = require('mongoose').Schema;


const BattleNetAccount = new Schema({
    accountName: String,
    platform: String,
    activeRegion: String,
    eu: Object,
    us: Object,
    kr: Object,
    updated: Date
});

module.exports = BattleNetAccount;
