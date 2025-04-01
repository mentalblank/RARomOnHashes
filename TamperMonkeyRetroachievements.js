// ==UserScript==
// @name         Rom Download on RA Hash List
// @namespace    https://github.com/MentalBlank/RARomOnHashes
// @updateURL    https://raw.githubusercontent.com/MentalBlank/RARomOnHashes/main/TamperMonkeyRetroachievements.js
// @downloadURL  https://raw.githubusercontent.com/MentalBlank/RARomOnHashes/main/TamperMonkeyRetroachievements.js
// @version      1.0.2
// @description  Add download links to retroachievements.org Supported Game Files page
// @author       MentalBlank
// @match        https://retroachievements.org/game/*/hashes
// @icon         https://static.retroachievements.org/assets/images/favicon.webp
// @grant        none
// @run-at       document-end
// ==/UserScript==

'use strict';

function delayAction(callback, delayTime) {
  setTimeout(callback, delayTime);  // delayTime in milliseconds
}

if (document.readyState === 'loading') {
  document.addEventListener("DOMContentLoaded", function() {
    delayAction(onDomLoaded, 500);
  });
} else {
  delayAction(onDomLoaded, 500);
}

function onDomLoaded() {
  console.log("Rom Download on RA Hash List Script is running!");

  const collectionDownloadURL = 'https://raw.githubusercontent.com/MentalBlank/RARomOnHashes/main/';
  const retroachievementsHashList = collectionDownloadURL + 'hashlinks.json';
  const updateInterval = 86400;  // 24 hours in seconds
  const currentUnixTimestamp = Math.floor(Date.now() / 1000);
  const collectionLastUpdated = parseInt(localStorage.getItem('collectionLastUpdated')) / 1000;
  const collectionLastModified = parseInt(localStorage.getItem('collectionLastModified'));
  const apiUrl = 'https://api.github.com/repos/MentalBlank/RARomOnHashes/commits?path=hashlinks.json';

  if (isNaN(collectionLastUpdated) || currentUnixTimestamp > collectionLastUpdated + updateInterval) {
    fetch(apiUrl)
      .then(response => response.json())
      .then(commits => {
        if (!commits || commits.length === 0) {
          throw new Error("Can't get last commit date from GitHub.");
        }

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
            .catch(error => {
              console.error(error);
              injectArchiveGames(null, true, "Can't get retroachievements hash list from GitHub. Please try again later.");
              localStorage.removeItem('collectionLastModified');
              localStorage.removeItem('collectionLastUpdated');
              localStorage.removeItem('collectionROMList');
            });
        }
      })
      .catch(error => {
        console.error(error);
        injectArchiveGames(null, true, "Can't get required information from GitHub. Please try again later.");
        localStorage.removeItem('collectionLastModified');
        localStorage.removeItem('collectionLastUpdated');
        localStorage.removeItem('collectionROMList');
      });
  } else {
    injectArchiveGames(JSON.parse(localStorage.getItem('collectionROMList')));
  }

  function injectArchiveGames(gameData, boolArchiveOrgDown = false, message = '') {
    let hashListParent = document.querySelector('ul.flex.flex-col.gap-3[data-testid="named-hashes"]');
    if (!hashListParent) {
      console.error("The hashlist element was not found.");
      return;
    }

    let hashLists = hashListParent.getElementsByTagName('li');
    let gameId = window.location.pathname.split("/")[2];
    if (!gameData[gameId]) {
      console.warn(`No ROM data found for game ID: ${gameId}`);
      return;
    }

    for (let x = 0; x < hashLists.length; ++x) {
      let retroHashNode = hashLists[x].querySelector("div.flex.flex-col.border-l-2");
      if (!retroHashNode) {
        console.error(`Could not find retroHashNode in LI #${x}`);
        continue;
      }

      let retroHashElement = retroHashNode.querySelector("p.font-mono");
      if (!retroHashElement) {
        console.error(`Could not find hash text in LI #${x}`);
        continue;
      }

      let retroHash = retroHashElement.innerText.trim().toUpperCase();
      retroHashElement.innerText = retroHash;

      if (boolArchiveOrgDown) {
        retroHashNode.insertAdjacentHTML("beforeend", `<b>${message}</b>`);
      } else {
        try {
          let romList = gameData[gameId];
          for (let i = 0; i < romList.length; i++) {
            let hashData = romList[i];
            for (let hash in hashData) {
              if (retroHash.toUpperCase() === hash.toUpperCase()) {
                let romURL = hashData[hash];
                if (!romURL.startsWith("http")) {
                  console.error(`Invalid ROM URL: ${romURL}`);
                  continue;
                }
                let fileName = romURL.substring(romURL.lastIndexOf('/') + 1);
                retroHashNode.insertAdjacentHTML("beforeend", `
                  <div>
                    <b><a href="${romURL}" target="_blank">Download ${fileName}</a></b>
                  </div>
                `);
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
}
