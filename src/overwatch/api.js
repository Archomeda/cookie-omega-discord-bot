const overwatch = require('overwatch-js');

async function getAccountProfile(battleTag, platform) {
    battleTag = battleTag.replace('-', '#');
    const searchName = battleTag.substring(0, battleTag.indexOf('#'));
    const accounts = await overwatch.search(searchName);
    const account = accounts.find(a => a.platformDisplayName === battleTag && a.platform === platform);
    if (account) {
        // Force 'us' here, since Blizzard doesn't expose region based stats anymore
        const overall = await overwatch.getOverall(platform, 'us', battleTag.replace('#', '-'));
        return overall ? overall.profile : undefined;
    }
    return undefined;
}

module.exports = {
    getAccountProfile
};
