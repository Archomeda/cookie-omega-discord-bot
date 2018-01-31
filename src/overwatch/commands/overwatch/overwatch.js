const { RichEmbed } = require('discord.js');
const { Command } = require('discord.js-commando-plus');

class CommandOverwatch extends Command {
    constructor(client) {
        super(client, {
            name: 'overwatch',
            group: 'overwatch',
            module: 'overwatch',
            memberName: 'overwatch',
            aliases: ['ow']
        });
    }

    async run(msg) {
        const BattleNetAccountModel = this.client.storageProvider.model('BattleNetAccount');
        const OverwatchStatsModel = this.client.storageProvider.model('OverwatchStats');

        const account = await BattleNetAccountModel.findOne({ discordId: msg.author.id });
        if (!account) {
            return msg.reply(this.localization.tl('output.no-account', msg.guild));
        }

        const embed = new RichEmbed()
            .setColor([247, 159, 17])
            .setURL(`https://playoverwatch.com/en-US/career/${account.platform}/${account.accountName.replace('-', '#')}`)
            .setTitle(this.localization.tl('embed.title', msg.guild, { accountName: account.accountName.replace('-', '#'), platform: account.platform }));

        const stats = await OverwatchStatsModel.findOne({ accountName: account.accountName, platform: account.platform });
        if (stats) {
            const description = this.localization.tl('embed.level', msg.guild, {
                level: (stats.stats.tier * 100) + stats.stats.level
            }) + '\n' + this.localization.tl('embed.rank', msg.guild, {
                rank: stats.stats.rank,
                ranking: stats.stats.ranking
            });
            embed.setThumbnail(stats.stats.avatar).setDescription(description);
        } else {
            embed.setDescription(this.localization.tl('embed.not-available', msg.guild));
        }

        return msg.reply('', { embed });
    }
}

module.exports = CommandOverwatch;
