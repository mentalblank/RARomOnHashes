// ==UserScript==
// @name         Rom Download on RA Hash List
// @namespace    https://github.com/MentalBlank/RARomOnHashes
// @updateURL    https://raw.githubusercontent.com/MentalBlank/RARomOnHashes/main/TamperMonkeyRetroachievements.js
// @downloadURL  https://raw.githubusercontent.com/MentalBlank/RARomOnHashes/main/TamperMonkeyRetroachievements.js
// @version      1.0.4
// @description  Add download links to retroachievements.org Supported Game Files pages
// @author       MentalBlank
// @match        https://retroachievements.org/*
// @icon         https://static.retroachievements.org/assets/images/favicon.webp
// @grant        none
// @run-at       document-end
// ==/UserScript==

'use strict';

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

function onDomLoaded() {
  console.log("Rom Download on RA Hash List Script running.");

  const collectionDownloadURL = 'https://raw.githubusercontent.com/MentalBlank/RARomOnHashes/main/';
  const retroachievementsHashList = collectionDownloadURL + 'hashlinks.json';
  const updateInterval = 86400; // 24 hours
  const currentUnixTimestamp = Math.floor(Date.now() / 1000);
  const collectionLastUpdated = parseInt(localStorage.getItem('collectionLastUpdated')) / 1000;
  const collectionLastModified = parseInt(localStorage.getItem('collectionLastModified'));
  const apiUrl = 'https://api.github.com/repos/MentalBlank/RARomOnHashes/commits?path=hashlinks.json';

  if (isNaN(collectionLastUpdated) || currentUnixTimestamp > collectionLastUpdated + updateInterval) {
    fetch(apiUrl)
      .then(response => response.json())
      .then(commits => {
        if (!commits || commits.length === 0) throw new Error("Can't get last commit date from GitHub. Please try again later.");
        const lastCommitDate = new Date(commits[0].commit.committer.date).getTime();
        if (lastCommitDate === collectionLastModified) {
          localStorage.setItem('collectionLastUpdated', Date.now());
          injectArchiveGames(JSON.parse(localStorage.getItem('collectionROMList')));
        } else {
          const corsProxy = "https://corsproxy.io/?url=";
          fetch(corsProxy + retroachievementsHashList, { cache: 'no-cache' })
            .then(response => response.json())
            .then(output => {
              injectArchiveGames(output);
              localStorage.setItem('collectionROMList', JSON.stringify(output));
              localStorage.setItem('collectionLastUpdated', Date.now());
              localStorage.setItem('collectionLastModified', lastCommitDate);
            })
            .catch(err => handleError(err, "Can't get hash list from GitHub. Please try again later."));
        }
      })
      .catch(err => handleError(err, "Can't get required commit info from GitHub. Please try again later."));
  } else {
    injectArchiveGames(JSON.parse(localStorage.getItem('collectionROMList')));
  }

  function handleError(err, msg) {
    console.error(msg, err);
    injectArchiveGames(null, true, msg);
    localStorage.removeItem('collectionLastModified');
    localStorage.removeItem('collectionLastUpdated');
    localStorage.removeItem('collectionROMList');
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
              const romURL = hashData[hash];
              if (!romURL.startsWith("http")) continue;

              const fileName = romURL.substring(romURL.lastIndexOf('/') + 1);
              let finalURL = romURL;

              // Use CORS proxy for Myrient downloads
              if (romURL.includes('myrient.erista.me')) {
                finalURL = "https://corsproxy.io/?url=" + encodeURIComponent(romURL);
              }

              retroHashNode.insertAdjacentHTML(
                "beforeend",
                `<div class="ra-rom-download">
                   <b><a href="${finalURL}" target="_blank">Download ${fileName}</a></b>
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
