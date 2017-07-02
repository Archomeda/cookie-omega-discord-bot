'use strict';

const overwatch = require('overwatch-js');

const AutoRemoveMessage = require('../../../../bot/middleware/AutoRemoveMessage');

const DiscordCommand = require('../../../../bot/modules/DiscordCommand');
const DiscordCommandError = require('../../../../bot/modules/DiscordCommandError');
const DiscordCommandParameter = require('../../../../bot/modules/DiscordCommandParameter');

const models = require('../../../models');


class CommandRegister extends DiscordCommand {
    constructor(bot) {
        super(bot, 'register', ['register']);

        this.setMiddleware(new AutoRemoveMessage(bot, this, { defaultRequest: 60, defaultResponse: 60 })); // Auto remove messages after 1 minute
    }

    initializeParameters() {
        return [
            new DiscordCommandParameter('account-name'),
            new DiscordCommandParameter('platform', { optional : true })
        ];
    }

    async onCommand(request) {
        const bot = this.getBot();
        const l = bot.getLocalizer();
        const params = request.getParams();
        const battleTag = params['account-name'].replace('#', '-');
        const platform = params.platform || 'pc';
        const user = request.getMessage().author;
        const discordId = user.id;

        let found = false;
        try {
            const accounts = await overwatch.search(battleTag);
            found = accounts.some(a => {
                const s = a.careerLink.split('/');
                return s.length > 2 && s[2] === platform;
            });
        } catch (err) {
            return l.t('module.overwatch:register.response-error', { error: err.message });
        }

        if (!found) {
            return l.t('module.overwatch:register.response-no-account-found');
        }

        const account = new models.BattleNetAccount({ discordId, accountName: battleTag, platform });
        await account.save();
        this.emit('new-registration', user, account);
        return l.t('module.overwatch:register.response-registered');
    }
}

module.exports = CommandRegister;
