const { promisify } = require('util');
const overwatch = require('overwatch-api');

const owGetProfileAsync = promisify(overwatch.getProfile);

async function getAccountProfile(battleTag, platform) {
    battleTag = battleTag.replace('#', '-');
    // Force 'us' here, since Blizzard doesn't expose region based stats anymore
    return await owGetProfileAsync(platform, 'us', battleTag);
}

async function getAccountStatsCompetitive(battleTag, platform) {
    const stats = await getAccountProfile(battleTag, platform);
    return stats.competitive;
}

module.exports = {
    getAccountProfile,
    getAccountStatsCompetitive
};
