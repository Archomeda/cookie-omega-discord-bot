const { Command } = require('discord.js-commando-plus');
const owApi = require('../../api');

class CommandRegister extends Command {
    constructor(client) {
        super(client, {
            name: 'register',
            group: 'overwatch',
            module: 'overwatch',
            memberName: 'register',
            examples: ['register BattleTag#1234', 'register BattleTag#1234 pc'],

            args: [
                {
                    key: 'battletag',
                    type: 'string'
                },
                {
                    key: 'platform',
                    type: 'string',
                    default: 'pc'
                }
            ]
        });
    }

    async run(msg, args) {
        const { battletag, platform } = args;
        const BattleNetAccountModel = this.client.storageProvider.model('BattleNetAccount');

        const owAccount = await owApi.getAccountProfile(battletag, platform);

        if (!owAccount || !owAccount.username) {
            return msg.reply(this.localization.tl('output.no-account-found', msg.guild));
        }

        let account = await BattleNetAccountModel.findOne({ discordId: msg.author.id });
        if (!account) {
            account = new BattleNetAccountModel({ discordId: msg.author.id });
        }

        account.accountName = battletag;
        account.platform = platform;
        await account.save();

        this.client.emit('battletagRegistration', msg.author, account);
        this.client.emit('debug', `New Battle.Net account registered for ${msg.author.tag}: ${account.accountName} (${account.platform})`);
        return msg.reply(this.localization.tl('output.registered', msg.guild));
    }
}

module.exports = CommandRegister;
