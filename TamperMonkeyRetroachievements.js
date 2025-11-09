// ==UserScript==
// @name         Rom Download on RA Hash List
// @namespace    https://github.com/MentalBlank/RARomOnHashes
// @updateURL    https://raw.githubusercontent.com/MentalBlank/RARomOnHashes/main/TamperMonkeyRetroachievements.js
// @downloadURL  https://raw.githubusercontent.com/MentalBlank/RARomOnHashes/main/TamperMonkeyRetroachievements.js
// @version      1.0.6
// @description  Add download links to retroachievements.org Supported Game Files pages
// @author       MentalBlank
// @match        https://retroachievements.org/*
// @match        https://myrient.erista.me/files/*
// @icon         https://static.retroachievements.org/assets/images/favicon.webp
// @grant        none
// @run-at       document-end
// ==/UserScript==

'use strict';

function idbOpen() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('RAHashCache', 1);
        request.onupgradeneeded = e => {
            e.target.result.createObjectStore('store');
        };
        request.onsuccess = e => resolve(e.target.result);
        request.onerror = reject;
    });
}

async function idbSet(key, value) {
    const db = await idbOpen();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('store', 'readwrite');
        tx.objectStore('store').put(value, key);
        tx.oncomplete = resolve;
        tx.onerror = reject;
    });
}

async function idbGet(key) {
    const db = await idbOpen();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('store', 'readonly');
        const req = tx.objectStore('store').get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = reject;
    });
}

function delayAction(callback, delayTime) {
    setTimeout(callback, delayTime);
}

function initObserver() {
    const observer = new MutationObserver(() => {
        const hashSection = document.querySelector('ul.flex.flex-col.gap-3[data-testid="named-hashes"]');
        if (hashSection && !hashSection.dataset.scriptInjected) {
            hashSection.dataset.scriptInjected = "true";
            delayAction(onDomLoaded, 200);
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", () => {
        initObserver();
        delayAction(onDomLoaded, 500);
    });
} else {
    initObserver();
    delayAction(onDomLoaded, 500);
}

async function onDomLoaded() {
    // ================= RA Page Logic =================
    if (window.location.hostname.includes("retroachievements.org")) {
        console.log("RA Rom Download Script running.");

        const collectionDownloadURL = 'https://raw.githubusercontent.com/MentalBlank/RARomOnHashes/main/';
        const retroachievementsHashList = collectionDownloadURL + 'hashlinks.json';
        const updateInterval = 86400; // 24 hours
        const currentUnixTimestamp = Math.floor(Date.now() / 1000);
        const collectionLastUpdated = parseInt(await idbGet('collectionLastUpdated')) / 1000;
        const collectionLastModified = parseInt(await idbGet('collectionLastModified'));
        const apiUrl = 'https://api.github.com/repos/MentalBlank/RARomOnHashes/commits?path=hashlinks.json';

        if (isNaN(collectionLastUpdated) || currentUnixTimestamp > collectionLastUpdated + updateInterval) {
            fetch(apiUrl)
                .then(response => response.json())
                .then(commits => {
                    if (!commits || commits.length === 0) throw new Error("Can't get last commit date from GitHub.");
                    const lastCommitDate = new Date(commits[0].commit.committer.date).getTime();
                    if (lastCommitDate === collectionLastModified) {
                        idbSet('collectionLastUpdated', Date.now());
                        idbGet('collectionROMList').then(val => injectArchiveGames(JSON.parse(val)));
                    } else {
                        const corsProxy = "https://corsproxy.io/?url=";
                        fetch(corsProxy + retroachievementsHashList, { cache: 'no-cache' })
                            .then(response => response.json())
                            .then(async output => {
                                injectArchiveGames(output);
                                await idbSet('collectionROMList', JSON.stringify(output));
                                await idbSet('collectionLastUpdated', Date.now());
                                await idbSet('collectionLastModified', lastCommitDate);
                            })
                            .catch(err => handleError(err, "Can't get hash list from GitHub."));
                    }
                })
                .catch(err => handleError(err, "Can't get commit info from GitHub."));
        } else {
            const val = await idbGet('collectionROMList');
            injectArchiveGames(JSON.parse(val));
        }

        async function handleError(err, msg) {
            console.error(msg, err);
            injectArchiveGames(null, true, msg);
            await idbSet('collectionLastModified', null);
            await idbSet('collectionLastUpdated', null);
            await idbSet('collectionROMList', null);
        }

        function injectArchiveGames(gameData, boolArchiveOrgDown = false, message = '') {
            const hashListParent = document.querySelector('ul.flex.flex-col.gap-3[data-testid="named-hashes"]');
            if (!hashListParent) return;

            const hashLists = hashListParent.getElementsByTagName('li');
            const gameId = window.location.pathname.split("/")[2];
            if (!gameData || !gameData[gameId]) return;

            for (let x = 0; x < hashLists.length; x++) {
                const retroHashNode = hashLists[x].querySelector("div.flex.flex-col.border-l-2");
                if (!retroHashNode) continue;
                const retroHashElement = retroHashNode.querySelector("p.font-mono");
                if (!retroHashElement) continue;

                const retroHash = retroHashElement.innerText.trim().toLowerCase();
                retroHashElement.innerText = retroHash;

                if (retroHashNode.querySelector(".ra-rom-download")) continue;

                if (boolArchiveOrgDown) {
                    retroHashNode.insertAdjacentHTML("beforeend", `<b>${message}</b>`);
                    continue;
                }

                try {
                    const romList = gameData[gameId];
                    for (let i = 0; i < romList.length; i++) {
                        const hashData = romList[i];
                        for (const hash in hashData) {
                            if (retroHash === hash.toLowerCase()) {
                                let romURL = hashData[hash];
                                if (!romURL.startsWith("http")) continue;

                                const fileName = romURL.substring(romURL.lastIndexOf('/') + 1);
                                if (romURL.includes("myrient.erista.me")) {
                                    romURL += `#autoSearch=${encodeURIComponent(fileName)}`;
                                }

                                retroHashNode.insertAdjacentHTML(
                                    "beforeend",
                                    `<div class="ra-rom-download">
                                        <b><a href="${romURL}" target="_blank">Download ${fileName}</a></b>
                                    </div>`
                                );
                                break;
                            }
                        }
                    }
                } catch (err) {
                    console.error("Error processing hash data:", err);
                }
            }
        }
    }

    // ================= Myrient Page Logic =================
    if (window.location.hostname.includes("myrient.erista.me")) {
        const hash = window.location.hash;
        if (hash?.startsWith("#autoSearch=")) {
            const fullFileName = decodeURIComponent(hash.replace("#autoSearch=", ""));
            const searchName = fullFileName.replace(/\.[^/.]+$/, "");
            const searchInput = document.querySelector('input#search');
            if (searchInput) {
                searchInput.disabled = true;
                searchInput.value = searchName;
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                searchInput.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter', code: 'Enter', keyCode: 13, which: 13 }));
                searchInput.disabled = false;
            }

            const fileUrl = window.location.origin + window.location.pathname.replace(/\/+$/, "") + "/" + encodeURIComponent(fullFileName);
            window.location.href = fileUrl;
        }
    }
}
