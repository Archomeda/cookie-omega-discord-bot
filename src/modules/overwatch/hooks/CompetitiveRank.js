'use strict';

const deepEqual = require('deep-equal');

const DiscordHook = require('../../../../bot/modules/DiscordHook');

const models = require('../../../models');

const owApi = require('../api');


const checkIntervals = {
    active: 8 * 60 * 1000,
    activeRandom: 4 * 60 * 1000,
    inactive: 50 * 60 * 1000,
    inactiveRandom: 20 * 60 * 1000
};


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

        const activeRegion = owApi.getActiveRegion(databaseStats, liveStats);
        if (activeRegion) {
            const previousRegion = databaseStats.activeRegion;
            const oldStats = databaseStats[previousRegion];
            const newStats = liveStats.get(activeRegion);

            if (oldStats && newStats && !deepEqual(oldStats, newStats)) {
                await this.onNewStats(member, account, oldStats, newStats, activeRegion);
            }
        } else {
            // Sadly we can't figure out the active region
            this.log(`Active region unknown for ${member.user.username} (${account.platform}, ${account.accountName})`);
        }

        databaseStats.activeRegion = activeRegion;
        for (const region of ['eu', 'us', 'kr']) {
            databaseStats[region] = liveStats.get(region);
        }
        databaseStats.updated = new Date();
        return databaseStats.save();
    }

    _setTimer(member, active, battleNetAccount) {
        // Active: 0 = no, 1 = yes, 2 = just stopped

        if (battleNetAccount.accountName && battleNetAccount.platform) {
            if (this._timers.has(member.id)) {
                clearTimeout(this._timers.get(member.id));
            }

            const timeout = active > 0 ?
                    checkIntervals.active + (Math.random() * checkIntervals.activeRandom) :
                    checkIntervals.inactive + (Math.random() * checkIntervals.inactiveRandom);

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
        const channel = config.get('channel-id');
        const members = client.channels.get(channel).guild.members;

        const accounts = await models.BattleNetAccount.find({ discordId: { $in: members.map(m => m.id) } });
        const mappedAccounts = new Map(accounts.map(a => [a.discordId, a]));

        for (const member of members.array()) {
            if (member.user.bot) {
                // Skip bots
                continue;
            }
            const account = mappedAccounts.get(member.id);
            if (account) {
                this._setTimer(member, member.presence.game && member.presence.game.name === 'Overwatch' ? 1 : 0, account);
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
            if (newGame && newGame.name === 'Overwatch') {
                this.log(`${newMember.user.username} is playing Overwatch`);
                this._setTimer(newMember, 1, account);
            } else if (oldGame && oldGame.name === 'Overwatch') {
                this.log(`${newMember.user.username} has stopped playing Overwatch`);
                this._setTimer(newMember, 2, account);
            }
        }
    }


    async onNewStats(member, account, oldStats, newStats, region) {
        const bot = this.getBot();
        const config = this.getModule().getConfig().root(this.getId());
        const client = bot.getClient();
        const l = bot.getLocalizer();

        this.log(`New stats for ${member.user.username} (${account.platform} ${region}, ${account.accountName})`);
        this.emit('new-stats', { member, account, oldStats, newStats, region });

        const channelId = config.get('channel-id');
        let channel;
        if (channelId && (channel = client.channels.get(channelId)) && channel.type === 'text') {
            if (oldStats.rank !== newStats.rank) {
                // New competitive rating
                const difference = newStats.rank - oldStats.rank;
                await channel.send(l.t(`module.overwatch:competitive-rank-checker.new-rank-${difference < 0 ? 'de' : 'in'}crease`, {
                    user: member.toString(),
                    oldRank: oldStats.rank,
                    newRank: newStats.rank,
                    difference: Math.abs(difference),
                    region
                }));
            }
            if (oldStats.ranking !== newStats.ranking) {
                // New competitive ranking
                await channel.send(l.t('module.overwatch:competitive-rank-checker.new-ranking', {
                    oldRanking: oldStats.ranking,
                    newRanking: newStats.ranking,
                    region
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
