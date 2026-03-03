// ==UserScript==
// @name         Rom Download on RA Hash List (PROJECT ABANDONED)
// @namespace    https://github.com/MentalBlank/RARomOnHashes
// @updateURL    https://raw.githubusercontent.com/MentalBlank/RARomOnHashes/main/abandonedScript.js
// @downloadURL  https://raw.githubusercontent.com/MentalBlank/RARomOnHashes/main/abandonedScript.js
// @version      1.2.0
// @description  OFFICIALLY ABANDONED due to Myrient closure. This script will now clear its local cache and stop running.
// @author       MentalBlank
// @match        https://retroachievements.org/*
// @icon         https://static.retroachievements.org/assets/images/favicon.webp
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // 1. CLEAR STORAGE: Deletes the IndexedDB 'RAHashCache' used by the original script
    const DB_NAME = 'RAHashCache';
    const LS_KEYS = [
        'RAHashCache',
        'collectionLastModified',
        'collectionLastUpdated',
        'collectionROMList'
    ];

    try {
        LS_KEYS.forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                console.log(`[Storage] LocalStorage key "${key}" removed.`);
            }
        });

        const deleteRequest = window.indexedDB.deleteDatabase(DB_NAME);
        deleteRequest.onsuccess = () => console.log(`[Storage] IndexedDB "${DB_NAME}" deleted successfully.`);
        deleteRequest.onblocked = () => console.warn(`[Storage] Deletion blocked. Please close other tabs.`);
    } catch (e) {
        console.error("[Storage] Error clearing local data:", e);
    }

    // 2. DISPLAY NOTICE: Informs the user why the script is dead and prompts uninstallation
    function injectAbandonmentNotice() {
        const hashList = document.querySelector('ul[data-testid="named-hashes"]');
        if (!hashList) return;

        const listItems = hashList.querySelectorAll('li');
        listItems.forEach(li => {
            if (li.dataset.scriptStatusInjected) return;
            li.dataset.scriptStatusInjected = "true";

            const container = li.querySelector("div.border-l-2");
            if (container) {
                const notice = document.createElement('div');
                notice.style.marginTop = "8px";
                notice.style.padding = "10px";
                notice.style.backgroundColor = "#450a0a";
                notice.style.border = "2px solid #f87171";
                notice.style.borderRadius = "4px";
                notice.style.color = "#fca5a5";
                notice.style.fontSize = "0.9rem";
                notice.style.fontWeight = "bold";
                notice.style.lineHeight = "1.4";

                notice.innerHTML = `
                    ⚠️ PROJECT ABANDONED<br>
                    <span style="font-weight:normal; font-style:italic; font-size:0.8rem;">
                    Due to the closure of Myrient, The Tampermonkey "Rom Download on RA Hash List" script is no longer maintained.<br>
                    <strong>Please uninstall this script from your manager.</strong>
                    </span>
                `;

                container.appendChild(notice);
            }
        });
    }

    const observer = new MutationObserver(injectAbandonmentNotice);
    observer.observe(document.body, { childList: true, subtree: true });

    injectAbandonmentNotice();
})();