const overwatch = require('overwatch-js');

async function getAccountProfile(battleTag, platform) {
    battleTag = battleTag.replace('#', '-');
    // Force 'us' here, since Blizzard doesn't expose region based stats anymore
    const overall = await overwatch.getOverall(platform, 'us', battleTag);
    return overall ? overall.profile : undefined;
}

module.exports = {
    getAccountProfile
};
