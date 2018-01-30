const Schema = require('mongoose').Schema;

const BattleNetAccount = new Schema({
    discordId: String,
    accountName: String,
    platform: String
});

module.exports = BattleNetAccount;
