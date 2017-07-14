'use strict';

const DiscordCommand = require('../../../../bot/modules/DiscordCommand');

const models = require('../../../models');


class CommandRank extends DiscordCommand {
    constructor(bot) {
        super(bot, 'rank', ['rank']);
    }

    async onCommand(message) {
        const bot = this.getBot();
        const l = bot.getLocalizer();
        const discordId = message.author.id;

        try {
            const account = await models.BattleNetAccount.findOne({ discordId });
            if (!account) {
                return l.t('module.overwatch:rank.response-no-account');
            }
            const stats = await models.OverwatchStats.findOne({ accountName: account.accountName, platform: account.platform });
            if (!stats) {
                return l.t('module.overwatch:rank.response-not-available');
            }
            const regionStats = stats[stats.activeRegion];

            return l.t('module.overwatch:rank.response', {
                account_name: account.accountName, // eslint-disable-line camelcase
                rank: regionStats.rank,
                ranking: regionStats.ranking,
                region: l.t(`module.overwatch:competitive-rank-checker.region-${stats.activeRegion}`)
            });
        } catch (err) {
            return l.t('module.overwatch:rank.response-error', { error: err.message });
        }
    }
}

module.exports = CommandRank;
