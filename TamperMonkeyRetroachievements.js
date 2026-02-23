// ==UserScript==
// @name         Rom Download on RA Hash List
// @namespace    https://github.com/MentalBlank/RARomOnHashes
// @updateURL    https://raw.githubusercontent.com/MentalBlank/RARomOnHashes/main/TamperMonkeyRetroachievements.js
// @downloadURL  https://raw.githubusercontent.com/MentalBlank/RARomOnHashes/main/TamperMonkeyRetroachievements.js
// @version      1.0.9
// @description  Add download links to retroachievements.org Supported Game Files pages
// @author       MentalBlank
// @match        https://retroachievements.org/*
// @match        https://myrient.erista.me/files/*
// @match        https://rezi.one/*
// @icon         https://static.retroachievements.org/assets/images/favicon.webp
// @grant        none
// @run-at       document-end
// ==/UserScript==

'use strict';

let cachedGameData = null;
let hashListObserver = null;
// Optimization: Memoization variables to avoid rebuilding the hash map on every DOM mutation
let lastGameData = null;
let lastGameId = null;
let lastGameHashesMap = null;

// ========== IndexedDB helpers ==========
let dbPromise = null;
async function idbOpen() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open('RAHashCache', 1);
        req.onupgradeneeded = e => e.target.result.createObjectStore('store');
        req.onsuccess = e => {
            const db = e.target.result;
            db.onclose = () => { dbPromise = null; };
            db.onversionchange = () => { db.close(); dbPromise = null; };
            resolve(db);
        };
        req.onerror = (e) => {
            dbPromise = null;
            reject(e);
        };
    });
    return dbPromise;
}

async function idbSet(key, value) {
    const db = await idbOpen();
    const tx = db.transaction('store', 'readwrite');
    tx.objectStore('store').put(value, key);
    return new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; });
}

async function idbGet(key) {
    const db = await idbOpen();
    const tx = db.transaction('store', 'readonly');
    const req = tx.objectStore('store').get(key);
    return new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = rej; });
}

// ========== RA page logic ==========
let hashObserver;

async function handleRA() {
    if (hashObserver) {
        hashObserver.disconnect();
    }

    console.log("RA Rom Download Script running.");
    const collectionUrl = 'https://raw.githubusercontent.com/MentalBlank/RARomOnHashes/main/hashlinks.json';
    const apiUrl = 'https://api.github.com/repos/MentalBlank/RARomOnHashes/commits?path=hashlinks.json';
    const updateInterval = 86400; // 24h

    const currentTime = Math.floor(Date.now() / 1000);
    const lastUpdated = parseInt(await idbGet('collectionLastUpdated')) / 1000;
    const lastModified = parseInt(await idbGet('collectionLastModified'));

    async function injectGames(gameData, archiveDown = false, msg = '') {
        const hashListParent = document.querySelector('ul.flex.flex-col.gap-3[data-testid="named-hashes"]');
        if (!hashListParent) return;
        const gameId = window.location.pathname.split("/")[2];

        let gameHashesMap;
        if (gameData === lastGameData && gameId === lastGameId && lastGameHashesMap) {
            // Optimization: Reuse the existing map if the game data and ID haven't changed
            gameHashesMap = lastGameHashesMap;
        } else {
            gameHashesMap = new Map();
            if (gameData?.[gameId]) {
                gameData[gameId].forEach(obj => {
                    Object.entries(obj).forEach(([hash, url]) => {
                        const lowerHash = hash.toLowerCase();
                        if (!gameHashesMap.has(lowerHash)) {
                            gameHashesMap.set(lowerHash, url);
                        }
                    });
                });
            }
            lastGameData = gameData;
            lastGameId = gameId;
            lastGameHashesMap = gameHashesMap;
        }

        for (const li of hashListParent.querySelectorAll('li')) {
            if (li.dataset.scriptInjected) continue;
            li.dataset.scriptInjected = "true";

            const hashNode = li.querySelector("div.flex.flex-col.border-l-2");
            const hashElement = hashNode?.querySelector("p.font-mono");
            if (!hashElement) continue;

            const retroHash = hashElement.innerText.trim().toLowerCase();
            hashElement.innerText = retroHash;

            const linksContainer = hashNode;
            const links = [];

            const romURL = gameHashesMap.get(retroHash);

            if (romURL) {
                const link = romURL.includes("myrient.erista.me")
                    ? `${romURL.substring(0, romURL.lastIndexOf('/') + 1)}#autoSearch=${encodeURIComponent(romURL.split("/").pop())}`
                    : romURL;
                links.push(`<a href="${link}" target="_blank">Download ROM</a>`);
            } else {
                const fullFileName = li.querySelector("span.font-bold")?.innerText.trim() || retroHash;
                links.push(`<a href="https://rezi.one/#autoSearch=${encodeURIComponent(fullFileName)}" target="_blank" style="color:#0af;">Search on Rezi</a>`);
            }

            links.forEach(html => {
                const div = document.createElement('div');
                div.innerHTML = html;
                linksContainer.appendChild(div);
            });
        }
    }

    async function fetchData() {
        try {
            const commits = await fetch(apiUrl).then(r => r.json());
            const commitDate = new Date(commits[0].commit.committer.date).getTime();

            if (commitDate === lastModified) {
                await idbSet('collectionLastUpdated', Date.now());
                if (!cachedGameData) {
                    let data = await idbGet('collectionROMList');
                    if (typeof data === 'string') {
                        try {
                            data = JSON.parse(data);
                            await idbSet('collectionROMList', data);
                        } catch (e) {
                            console.error("Error parsing stored data", e);
                            data = null;
                        }
                    }
                    cachedGameData = data;
                }
                injectGames(cachedGameData);
            } else {
                const data = await fetch(collectionUrl, { cache: 'no-cache' }).then(r => r.json());
                cachedGameData = data;
                injectGames(data);
                // Optimization: Store data as an object to avoid expensive JSON serialization/deserialization
                await idbSet('collectionROMList', data);
                await idbSet('collectionLastUpdated', Date.now());
                await idbSet('collectionLastModified', commitDate);
            }
        } catch (err) {
            console.error("Error fetching hash list:", err);
            injectGames(null, true, "Error fetching hash list");
            await idbSet('collectionLastModified', null);
            await idbSet('collectionLastUpdated', null);
            await idbSet('collectionROMList', null);
        }
    }

    const cacheValid = !isNaN(lastUpdated) && currentTime <= lastUpdated + updateInterval;
    if (cacheValid) {
        if (!cachedGameData) {
            let data = await idbGet('collectionROMList');
            if (typeof data === 'string') {
                try {
                    data = JSON.parse(data);
                    await idbSet('collectionROMList', data);
                } catch (e) {
                    data = null;
                }
            }
            cachedGameData = data;
        }
        await injectGames(cachedGameData);
    } else {
        await fetchData();
    }

    const hashSection = document.querySelector('ul.flex.flex-col.gap-3[data-testid="named-hashes"]');
    if (hashSection) {
        if (!hashObserver) {
            hashObserver = new MutationObserver(() => handleRA());
        }
        hashObserver.observe(hashSection, { childList: true, subtree: true });
    }
}

// ========== Myrient/Rezi auto-search ==========
function handleAutoSearch(inputSelector, isMyrient = false) {
    const hash = window.location.hash;
    if (!hash?.startsWith("#autoSearch=")) return;
    const fullFileName = decodeURIComponent(hash.replace("#autoSearch=", ""));
    const searchName = fullFileName.replace(/\.[^/.]+$/, "");

    if (isMyrient) {
        const searchInput = document.querySelector(inputSelector);
        if (searchInput) {
            searchInput.disabled = true;
            searchInput.value = searchName;
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            searchInput.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter', code: 'Enter', keyCode: 13, which: 13 }));
            searchInput.disabled = false;
        }
        const fileUrl = `${window.location.origin}${window.location.pathname.replace(/\/+$/, "")}/${encodeURIComponent(fullFileName)}`;
        window.location.href = fileUrl;
    } else {
        const interval = setInterval(() => {
            try {
                const input = document.querySelector(inputSelector);
                if (input) {
                    input.focus();
                    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                    nativeSetter.call(input, searchName);
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter', code: 'Enter', keyCode: 13, which: 13 }));
                    clearInterval(interval);
                }
            } catch {}
        }, 100);
    }
}

// ========== Initialization ==========
function init() {
    if (window.location.hostname.includes("retroachievements.org")) handleRA();
    if (window.location.hostname.includes("myrient.erista.me")) handleAutoSearch('input#search', true);
    if (window.location.hostname.includes("rezi.one")) handleAutoSearch('input#SEARCHBOX');

    const observer = new MutationObserver(() => {
        if (document.querySelector('ul.flex.flex-col.gap-3[data-testid="named-hashes"]')) handleRA();
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 500));
} else {
    setTimeout(init, 500);
}