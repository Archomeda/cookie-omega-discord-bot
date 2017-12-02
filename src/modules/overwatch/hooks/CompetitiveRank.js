'use strict';

const deepEqual = require('deep-equal');

const DiscordHook = require('../../../../bot/modules/DiscordHook');

const models = require('../../../models');

const owApi = require('../api');


const checkIntervals = {
    active: 50 * 60 * 1000,
    activeRandom: 20 * 60 * 1000,
    finished: 4 * 60 * 1000,
    finishedRandom: 2 * 60 * 1000,
    inactive: 50 * 60 * 1000,
    inactiveRandom: 20 * 60 * 1000
};
const gameName = 'Overwatch';


class HookCompetitiveRank extends DiscordHook {
    constructor(bot) {
        super(bot, 'competitive-rank-checker');
        this._localizerNamespaces = 'module.overwatch';

        this._hooks = {
            presenceUpdate: this.onUpdate.bind(this)
        };
    }

    async _checkStats(member, account) {
        let [databaseStats, liveStats] = await Promise.all([
            models.OverwatchStats.findOne({ accountName: account.accountName, platform: account.platform }),
            owApi.getAccountProfile(account.accountName, account.platform)
        ]);
        if (!databaseStats) {
            databaseStats = new models.OverwatchStats({ accountName: account.accountName, platform: account.platform });
        }

        const oldStats = databaseStats.stats;
        if (oldStats && liveStats && !deepEqual(oldStats, liveStats)) {
            await this.onNewStats(member, account, oldStats, liveStats);
        }

        databaseStats.stats = liveStats;
        databaseStats.updated = new Date();
        return databaseStats.save();
    }

    _setTimer(member, active, battleNetAccount) {
        // Active: 0 = no, 1 = yes, 2 = just stopped

        if (battleNetAccount.accountName && battleNetAccount.platform) {
            if (this._timers.has(member.id)) {
                clearTimeout(this._timers.get(member.id));
            }

            let timeout;
            switch (active) {
                case 1:
                    timeout = checkIntervals.active + (Math.random() * checkIntervals.activeRandom);
                    break;
                case 2:
                    timeout = checkIntervals.finished + (Math.random() * checkIntervals.finishedRandom);
                    break;
                case 0:
                default:
                    timeout = checkIntervals.inactive + (Math.random() * checkIntervals.inactiveRandom);
                    break;
            }

            this._timers.set(member.id, setTimeout(async (member, active, account) => {
                this._timers.delete(member.id);
                try {
                    await this._checkStats(member, account);
                } catch (err) {
                    this.log(`Error while checking stats for ${member.user.username} (${account.platform}, ${account.accountName}): ${err.message}`, 'warn');
                    this.log(err.stack, 'warn');
                }
                this._setTimer(member, active % 2, account); // 2 -> 0
            }, timeout, member, active, battleNetAccount));
        }
    }

    async _setAllGuildMemberTimers() {
        const client = this.getBot().getClient();
        const config = this.getConfig();
        const channel = client.channels.get(config.get('channel-id'));

        if (!channel) {
            // TODO: This might be because of an outage, need to investigate if there are guildAvailable events or something
            this.log(`The defined channel is not available`, 'warn');
            return;
        }
        const members = channel.guild.members;

        const accounts = await models.BattleNetAccount.find({ discordId: { $in: members.map(m => m.id) } });
        const mappedAccounts = new Map(accounts.map(a => [a.discordId, a]));

        for (const member of members.array()) {
            if (member.user.bot) {
                // Skip bots
                continue;
            }
            const account = mappedAccounts.get(member.id);
            if (account) {
                this._setTimer(member, member.presence.game && member.presence.game.name === gameName ? 1 : 0, account);
            }
        }
    }

    async onUpdate(oldMember, newMember) {
        if (newMember.user.bot) {
            // Skip bots
            return;
        }

        const oldGame = oldMember.presence.game;
        const newGame = newMember.presence.game;

        if ((!oldGame && newGame) || (oldGame && !newGame) || (oldGame && newGame && !oldGame.equals(newGame))) {
            // Only changes in the current playing game
            const account = await models.BattleNetAccount.findOne({ discordId: newMember.id });
            if (newGame && newGame.name === gameName) {
                this.log(`${newMember.user.username} is playing ${gameName}`);
                this._setTimer(newMember, 1, account);
            } else if (oldGame && oldGame.name === 'Overwatch') {
                this.log(`${newMember.user.username} has stopped playing ${gameName}`);
                this._setTimer(newMember, 2, account);
            }
        }
    }


    async onNewStats(member, account, oldStats, newStats) {
        const bot = this.getBot();
        const config = this.getModule().getConfig().root(this.getId());
        const client = bot.getClient();
        const l = bot.getLocalizer();

        this.log(`New stats for ${member.user.username} (${account.platform}, ${account.accountName})`);
        this.emit('new-stats', { member, account, oldStats, newStats });

        const channelId = config.get('channel-id');
        let channel;
        if (channelId && (channel = client.channels.get(channelId)) && channel.type === 'text') {
            if (oldStats.rank !== newStats.rank && newStats.rank) {
                // New competitive rating
                const difference = newStats.rank - oldStats.rank;
                const localeKey = oldStats.rank ?
                    `module.overwatch:competitive-rank-checker.rank-${difference < 0 ? 'de' : 'in'}crease` :
                    'module.overwatch:competitive-rank-checker.new-rank';
                await channel.send(l.t(localeKey, {
                    user: member.toString(),
                    oldRank: oldStats.rank,
                    newRank: newStats.rank,
                    difference: Math.abs(difference)
                }));
            }
            if (oldStats.ranking !== newStats.ranking && newStats.ranking) {
                // New competitive ranking
                await channel.send(l.t(`module.overwatch:competitive-rank-checker.${oldStats.ranking ? 'ranking-change' : 'new-ranking'}`, {
                    user: member.toString(),
                    oldRanking: oldStats.ranking,
                    newRanking: newStats.ranking
                }));
            }
        }
    }

    async enableHook() {
        this._timers = new Map();
        await super.enableHook();
        return this._setAllGuildMemberTimers();
    }

    async disableHook() {
        for (const timer of this._timers.values()) {
            clearTimeout(timer);
        }
        this._timers = undefined;
        return super.disableHook();
    }
}

module.exports = HookCompetitiveRank;
