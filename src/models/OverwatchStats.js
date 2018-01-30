const Schema = require('mongoose').Schema;

const BattleNetAccount = new Schema({
    accountName: String,
    platform: String,
    stats: Object,
    updated: Date
});

module.exports = BattleNetAccount;
