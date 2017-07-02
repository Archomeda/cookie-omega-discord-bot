'use strict';


/**
 * Gets the maximum value in an Array, Map or Object. If strict is enabled, only one maximum value is allowed.
 * If no maximum value is found, undefined is returned.
 * @param {Array|Map|Object} items - The items.
 * @param {boolean} [strict = false] - Strict mode.
 * @returns {*|undefined} The maximum value, or undefined if not found.
 */
function maxAll(items, strict = false) {
    const index = maxAllIndex(items, strict);
    if (Array.isArray(items)) {
        return index > -1 ? items[index] : undefined;
    }
    return index ? items[index] : undefined;
}

/**
 * Gets the index of the maximum value in an Array, Map or Object. If strict is enabled, only one maximum value is allowed.
 * If no maximum value is found, -1 is returned in case of an Array, and otherwise undefined.
 * @param {Array|Map|Object} items - The items.
 * @param {boolean} [strict = false] - Strict mode.
 * @returns {number|String} The index or key of the maximum value, or if not found -1 in case of Arrays and undefined otherwise.
 */
function maxAllIndex(items, strict = false) {
    let max;
    let index = -1;

    if (!items) {
        return -1;
    }
    if (Array.isArray(items)) {
        for (let i = 0; i < items.length; i++) {
            if (!max || items[i] > max) {
                max = items[i];
                index = i;
            } else if (strict && items[i] === max) {
                index = -1; // Strict doesn't allow multiple maximum values, reset index
            }
        }
    } else if (items instanceof Map) {
        for (const [key, item] of items) {
            if (!max || item > max) {
                max = item;
                index = key;
            } else if (strict && item === max) {
                index = undefined; // Strict doesn't allow multiple maximum values, reset index
            }
        }
    } else if (typeof items === 'object') {
        for (const key in items) {
            if (items.hasOwnProperty(key)) {
                if (!max || items[key] > max) {
                    max = items[key];
                    index = key;
                } else if (strict && items[key] === max) {
                    index = undefined; // Strict doesn't allow multiple maximum values, reset index
                }
            }
        }
    }

    return index;
}

module.exports = {
    maxAll,
    maxAllIndex
};
