'use strict';

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const ALLOW_STALE_FILES = true; // do not fail on invalid fresh json but valid old file (default)

// 1. OSRM routing providers (file copy + validate)
generate({
    file: 'src/generated/online-routing-providers.json',
    json: cat('../main/static/online-routing-providers.json'),
    validate: (json) => json.providers[0].type === 'osrm',
});

// 2. POI icons array based on list of svg-files
generate({
    file: 'src/generated/poiicons.json',
    json: ls('public/images/poi-icons-svg'),
    validate: (json) => json.some((x) => x === 'mx_service.svg'),
});

// 3. Android Values (filter from file + validate)
generate({
    file: 'src/generated/android-values.json',
    json: cat('../main/src/translations/android-values.json'),
    filter: filterAndroidValues, // keys -> rendering_attr_*
    validate: (json) => json['rendering_attr_highway_class_track_name'] === 'Track',
});

// 4. Parsed Road-Styles (TODO call external Java-util instead of URL get)
generate({
    file: 'src/generated/styles.json',
    json: await get(getUrlStyles()),
    validate: (json) => json['default.render.xml']['routeInfo_surface'].length > 0,
});

// Filter Android Values which are really required by Web Map
function filterAndroidValues(json) {
    const filtered = {};
    Object.keys(json).forEach(
        (k) => (k.match(/^rendering_attr_/) || k.match(/^routeInfo_/)) && (filtered[k] = json[k])
    );
    return filtered;
}

function getUrlStyles() {
    let url = new URL('https://osmand.net/gpx/get-styles');
    const params = {
        styles: [
            'default.render.xml',
            'skimap.render.xml',
            'topo.render.xml',
            'nautical.render.xml',
            'regions.render.xml',
            'offroad.render.xml',
            'mapnik.render.xml',
            'desert.render.xml',
        ],
        attributes: [
            'routeInfo_roadClass',
            'routeInfo_surface',
            'routeInfo_smoothness',
            'routeInfo_steepness',
            'routeInfo_winter_ice_road',
            'routeInfo_tracktype',
            'routeInfo_horse_scale',
            'routeInfo_piste_difficulty',
            'routeInfo_piste_type',
        ],
    };
    url.search = new URLSearchParams(params).toString();
    return url;
}

/**
 * @param file <String> file to store fresh data (and read/validate stale data)
 * @param json <JSON> ready to use JSON-object to filter, validate and store to file
 * @param filter <Function> (json) => () filter-function, should return filtered JSON-data (optional)
 * @param validate <Function> (json) => () validate-function, should validate and return true/false (optional)
 */
function generate({ file, json, filter, validate }) {
    if (json) {
        try {
            if (filter) {
                json = filter(json);
            }
            if (validate && validate(json) !== true) {
                throw new Error(`FRESH-JSON invalid ('${file}')`);
            }
            const pretty = prettyJSON(json);
            writeFileSync(file, pretty, { encoding: 'utf8' });
            console.log(`OK. File '${file}' generated successfully (${pretty.length} bytes)`);
            return true;
        } catch (e) {
            if (ALLOW_STALE_FILES === false) {
                throw new Error(e);
            } else {
                console.warn(e);
            }
        }
    }
    if (ALLOW_STALE_FILES) {
        const stale = cat(file);
        if (stale && validate && validate(stale) !== true) {
            throw new Error(`STALE-JSON invalid ('${file}')`);
        }
        if (stale) {
            const pretty = prettyJSON(stale);
            console.log(`WARNING. Stale '${file}' accepted (${pretty.length} bytes)`);
            return true;
        }
    }

    throw new Error(`Fatal error: ${file} neither found nor generated`);
}

function prettyJSON(smth) {
    return JSON.stringify(smth, null, 2);
}

function ls(dir) {
    try {
        return readdirSync(dir).sort();
    } catch (e) {
        console.warn(e);
        return null;
    }
}

function cat(file) {
    try {
        const input = readFileSync(file, { encoding: 'utf8' });
        // remove utf8 Byte Order Mark (not supported by JSON.parse)
        return JSON.parse(input.replace(/^\uFEFF/gm, '')); // drop bom
    } catch (e) {
        console.warn(e);
        return null;
    }
}

async function get(url) {
    try {
        const response = await fetch(url);
        return await response.json();
    } catch (e) {
        console.warn(e);
        return null;
    }
}
