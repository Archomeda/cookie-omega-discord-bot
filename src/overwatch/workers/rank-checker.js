const deepEqual = require('deep-equal');
const { Worker } = require('discord.js-commando-plus');
const owApi = require('../api');

const randStopped = () => Math.round((30 * Math.random()) + 45);
const randIdle = () => Math.round((60 * 60 * Math.random()) + (2 * 60 * 60));

class WorkerRankChecker extends Worker {
    constructor(client) {
        super(client, {
            id: 'rank-checker',
            module: 'overwatch',
            timer: 60 * 60 * 1000
        });

        client.on('presenceUpdate', this.onPresenceUpdate.bind(this));

        this.checkStatsTimers = new Map();
    }

    async run() {
        const BattleNetAccountModel = this.client.storageProvider.model('BattleNetAccount');

        const users = await BattleNetAccountModel.find({}).then(users => Promise.all(users.map(u => this.client.fetchUser(u.discordId))));
        for (const user of users) {
            this.setTimer(user);
        }
    }

    stop() {
        this.checkStatsTimers.forEach(t => clearTimeout(t));
        this.checkStatsTimers.clear();
        return super.stop();
    }

    async onPresenceUpdate(oldMember, newMember) {
        if (newMember.user.bot) {
            // Skip bots
            return;
        }

        if (!this.isEnabledIn(newMember.guild)) {
            // Not enabled in this guild
            return;
        }

        const oldGame = oldMember.presence.game;
        const newGame = newMember.presence.game;

        if ((!oldGame && newGame) || (oldGame && !newGame) || (oldGame && newGame && !oldGame.equals(newGame))) {
            // Check only whenever a person has stopped playing Overwatch
            if (oldGame && oldGame.name === 'Overwatch') {
                if (this.checkStatsTimers.has(newMember.id)) {
                    clearTimeout(this.checkStatsTimers.get(newMember.id));
                }
                // Check after 45 - 90 seconds
                const time = randStopped();
                const timer = setTimeout(() => this.checkStats(newMember.user), time * 1000);
                this.checkStatsTimers.set(newMember.id, timer);
                this.client.emit('debug', `${newMember.user.tag} stopped playing Overwatch, stats update check scheduled ${time} seconds from now`);
            }
        }
    }

    setTimer(user) {
        if (!this.checkStatsTimers.has(user.id)) {
            // Check after 2 - 3 hours
            const time = randIdle();
            const timer = setTimeout(() => this.checkStats(user), time * 1000);
            this.checkStatsTimers.set(user.id, timer);
            this.client.emit('debug', `Overwatch stats update check for ${user.tag} scheduled ${Math.round(time / 60)} minutes from now`);
        }
    }

    async checkStats(user) {
        const BattleNetAccountModel = this.client.storageProvider.model('BattleNetAccount');
        const OverwatchStatsModel = this.client.storageProvider.model('OverwatchStats');

        this.client.emit('debug', `Checking Overwatch stats for ${user.tag}`);
        if (this.checkStatsTimers.has(user.id)) {
            this.checkStatsTimers.delete(user.id);
        }

        const account = await BattleNetAccountModel.findOne({ discordId: user.id });

        if (account.accountName && account.platform) {
            try {
                let [databaseStats, liveStats] = await Promise.all([
                    OverwatchStatsModel.findOne({ accountName: account.accountName, platform: account.platform }),
                    owApi.getAccountProfile(account.accountName, account.platform)
                ]);
                if (!databaseStats) {
                    databaseStats = new OverwatchStatsModel({ accountName: account.accountName, platform: account.platform });
                }

                const oldStats = databaseStats.stats;
                if (oldStats && liveStats && !deepEqual(oldStats, liveStats)) {
                    this.client.emit('overwatchStats', user, account, oldStats, liveStats);
                }

                databaseStats.stats = liveStats;
                databaseStats.updated = new Date();
                await databaseStats.save();
            } catch (err) {
                this.client.emit('warn', `Error while checking Overwatch stats for ${user.username} (${account.platform}, ${account.accountName}): ${err.message}`);
                this.client.emit('warn', err.stack);
            }
        }

        this.setTimer(user);
    }
}

module.exports = WorkerRankChecker;
