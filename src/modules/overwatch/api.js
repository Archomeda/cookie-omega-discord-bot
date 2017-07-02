'use strict';

const deepEqual = require('deep-equal');
const overwatch = require('overwatch-js');

const { maxAllIndex } = require('../../utils/Max');


async function getAccountProfile(battleTag, platform) {
    battleTag = battleTag.replace('#', '-');
    const regions = (await overwatch.search(battleTag)).map(a => {
        const s = a.careerLink.split('/');
        if (s.length > 3 && s[2] === platform) {
            return s[3];
        }
        return undefined;
    }).filter(r => r);

    return new Map(await Promise.all(regions.map(async r => {
        const overall = await overwatch.getOverall(platform, r, battleTag);
        return [r, overall ? overall.profile : undefined];
    })));
}

function getActiveRegion(databaseStats, liveStats) {
    let activeRegion;
    if (databaseStats) {
        for (const region of ['eu', 'us', 'kr']) {
            activeRegion = deepEqual(databaseStats[region], liveStats.get(region)) ? activeRegion : region;
        }
    }
    if (!activeRegion) {
        const getLevel = (data, region) => data.has(region) ? (data.get(region).tier * 100) + data.get(region).level : undefined;
        const levels = {
            eu: getLevel(liveStats, 'eu'),
            us: getLevel(liveStats, 'us'),
            kr: getLevel(liveStats, 'kr')
        };
        activeRegion = maxAllIndex(levels);
    }
    return activeRegion;
}


module.exports = {
    getAccountProfile,
    getActiveRegion
};
