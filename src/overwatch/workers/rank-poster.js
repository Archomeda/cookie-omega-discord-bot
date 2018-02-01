const { RichEmbed } = require('discord.js');
const { Worker } = require('discord.js-commando-plus');

class WorkerRankChecker extends Worker {
    constructor(client) {
        super(client, {
            id: 'rank-poster',
            module: 'overwatch'
        });
    }

    run() {
        this._onNewStats = this.onNewStats.bind(this);
        this.client.on('overwatchStats', this._onNewStats);
    }

    onStop() {
        this.client.removeListener('overwatchStats', this._onNewStats);
    }

    async onNewStats(user, account, oldStats, newStats) {
        this.client.emit('debug', `New Overwatch stats for ${user.tag} (${account.platform}, ${account.accountName})`);

        await Promise.all(this.client.guilds.map(g => this.isEnabledIn(g) && g.available && g.fetchMember(user)));
        const channels = this.client.guilds
            .filterArray(g => g.available && g.members.has(user.id))
            .map(g => this.isEnabledIn(g) && g.settings.get('rank-poster-channel') && g.channels.get(g.settings.get('rank-poster-channel')))
            .filter(g => g.channel && g.channel.type === 'text');
        if (channels.length === 0) {
            return;
        }

        await Promise.all(channels.map(c => {
            const embed = new RichEmbed()
                .setColor([247, 159, 17])
                .setURL(`https://playoverwatch.com/en-US/career/${account.platform}/${account.accountName.replace('#', '-')}`)
                .setTitle(this.localization.tl('embed.title', c.guild, { accountName: account.accountName.replace('-', '#'), platform: account.platform }))
                .setThumbnail(newStats.avatar);

            const messages = [];
            if (oldStats.rank !== newStats.rank && newStats.rank) {
                // New competitive rating
                const difference = newStats.rank - oldStats.rank;
                const localeKey = oldStats.rank ? `output.rank-${difference < 0 ? 'de' : 'in'}crease` : 'output.new-rank';
                messages.push(this.localization.tl(localeKey, {
                    oldRank: oldStats.rank,
                    newRank: newStats.rank,
                    difference: Math.abs(difference)
                }));
            }
            if (oldStats.ranking !== newStats.ranking && newStats.ranking) {
                // New competitive ranking
                messages.push(this.localization.tl(`output.${oldStats.ranking ? 'ranking-change' : 'new-ranking'}`, {
                    oldRanking: oldStats.ranking,
                    newRanking: newStats.ranking
                }));
            }
            if (messages.length === 0) {
                return undefined;
            }
            embed.setDescription(messages.join('\n'));

            return c.send(user.toString(), { embed });
        }));
    }
}

module.exports = WorkerRankChecker;
