// ==UserScript==
// @name         TamperMonkeyRetroachievementsFixed
// @namespace    https://github.com/MentalBlank/RARomOnHashesUserScript
// @updateURL    https://raw.githubusercontent.com/MentalBlank/RARomOnHashesUserScript/refs/heads/main/OriginalTamperMonkeyRetroachievementsFixed.js
// @downloadURL  https://raw.githubusercontent.com/MentalBlank/RARomOnHashesUserScript/refs/heads/main/OriginalTamperMonkeyRetroachievementsFixed.js
// @version      1.0.01
// @description  Add download links to retroachievements.org Supported Game Files page e.g. https://retroachievements.org/game/19339/hashes
// @author       wholee
// @match        https://retroachievements.org/game/*/hashes
// @icon         https://archive.org/images/glogo.jpg
// @grant        none
// @run-at       document-end
// ==/UserScript==

//
// 0.7:   Updated archiveOrgLastModified URL
// 0.8:   Don't call archive.org with every page refresh
// 0.9:   Refactor code
// 0.9.1: Use {cache: 'no-cache'} for retroachievementsHashList download
// 0.9.2: Updated disclaimer
// 0.9.3: Split PS2 to new archive.org collection
// 0.9.4: Refactor PS2
// 0.9.5: Add note for FLYCAST ROMs
// 0.9.6: Added descriptive error messages
// 0.9.7: Added FBNeoZipLink
// 0.9.8: Due to page changes, updated disclaimer position
// 0.9.9: Cosmetic code changes, FBNeo link updates and disclaimer text
// 0.9.91: Cosmetic code changes, fix typo in PS2 download link
// 0.9.92: Separated NES and SNES to their own archive items
// 0.9.93: Separated Playstation
// 0.9.94: Separated Playstation Portable
// 0.9.95: Small code refactor
// 0.9.96: Added GameCube
// 0.9.97: HTML-encode links to archive.org
// 0.9.98: Remove HTML-encode links
// 1.0.00: Six months hiatus updates
//         Update download link position due to site changes
//         Add missing and Paid Hash info
//         Split PlayStation 2 in two due to the size
//         Rename NES and SNES collections to match ConsoleName update
// 1.0.01: wrapped download links in <div>
'use strict';

// Add delay function
function delayAction(callback, delayTime) {
    setTimeout(callback, delayTime);  // delayTime is in milliseconds
}

if (document.readyState === 'loading') {
    // If the DOM is still loading, add event listener and wait for DOMContentLoaded
    document.addEventListener("DOMContentLoaded", function() {
        delayAction(onDomLoaded, 400);  // Delay for 2000 milliseconds (2 seconds)
    });
} else {
    // If DOM is already loaded, execute the function with delay immediately
    delayAction(onDomLoaded, 400);  // Delay for 2000 milliseconds (2 seconds)
}

function onDomLoaded() {
  const collectionName = 'retroachievements_collection';
  const mainCollectionItem = 'v5';
  const separateCollectionItems = ['NES-Famicom', 'SNES-Super Famicom', 'PlayStation', 'PlayStation 2', 'PlayStation Portable', 'GameCube'];
  const collectionDownloadURL = 'https://archive.org/download/' + collectionName;
  const collectionDetailsURL = 'https://archive.org/details/' + collectionName + '_' + mainCollectionItem;
  const collectionLastModifiedURL = 'https://archive.org/metadata/' + collectionName + '_' + mainCollectionItem + '/item_last_updated';
  const FBNeoROMSDownloadURL = 'https://archive.org/download/2020_01_06_fbn/roms/';
  const FBNeoROMSDetailsURL = 'https://archive.org/details/2020_01_06_fbn/';
  const retroachievementsHashList = 'TamperMonkeyRetroachievements.json';
  const updateInterval = 86400; // 24 hours
  const currentUnixTimestamp = Math.floor(Date.now() / 1000);
  const collectionLastUpdated = parseInt(localStorage.getItem('collectionLastUpdated'));
  const collectionLastModified = parseInt(localStorage.getItem('collectionLastModified'));

  if (isNaN(collectionLastUpdated) || currentUnixTimestamp > collectionLastUpdated + updateInterval) {
    fetch(collectionLastModifiedURL)
      .then(response => response.json())
      .then(output => {
        if (output.result === undefined) {
          throw new Error("Can't get last modified date from archive.org. " + output.error);
        } else {
          localStorage.setItem('collectionLastModified', output.result);
        }
        if (parseInt(output.result) === collectionLastModified) {
          localStorage.setItem('collectionLastUpdated', currentUnixTimestamp);
          injectArchiveGames(JSON.parse(localStorage.getItem('collectionROMList')));
        } else {

          // Define the CORS proxy URL (you can use a free one, but be cautious as they might have rate limits)
          const corsProxy = "https://corsproxy.io/?url=";

          // Modify the fetch URL to include the CORS proxy
          fetch(corsProxy + collectionDownloadURL + '_' + mainCollectionItem + '/' + retroachievementsHashList, { cache: 'no-cache' })
            .then(response => response.json())
            .then(output => {
              injectArchiveGames(output);
              localStorage.setItem('collectionROMList', JSON.stringify(output));
              localStorage.setItem('collectionLastUpdated', currentUnixTimestamp);
            })
            .catch(error => {
              console.error(error);
              injectArchiveGames(null, true, "Can't get retroachievements hash list from archive.org. Please try again later.");
              localStorage.removeItem('collectionLastModified');
              localStorage.removeItem('collectionLastUpdated');
              localStorage.removeItem('collectionROMList');
            });
        }
      })
      .catch(error => {
        console.error(error);
        injectArchiveGames(null, true, "Can't get required information from archive.org. Please try again later.");
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
    } else {
    }
    let hashLists = hashListParent.getElementsByTagName('li');
    let gameId = window.location.pathname.split("/")[2];
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
      retroHashElement.innerText = retroHash; // Fix hash capitalization

      if (boolArchiveOrgDown) {
        retroHashNode.insertAdjacentHTML("beforeend", `<b>${message}</b>`);
      } else {
        try {
          if (gameData[gameId] && gameData[gameId][0][retroHash]) {
            let hashData = gameData[gameId][0][retroHash];
            let ROMdataArray = hashData.split('/');
            let system = ROMdataArray[0];
            let fileName = ROMdataArray[ROMdataArray.length - 1];
            let link = '';
            switch (true) {
              case hashData.includes('\\'):
                ROMdataArray = hashData.split('\\');
                system = ROMdataArray[0].replace('megadriv', 'megadrive');
                fileName = ROMdataArray[ROMdataArray.length - 1];
                link = `${FBNeoROMSDownloadURL}${system}.zip/${system}/${fileName}`;
                  <a href="${FBNeoROMSDetailsURL}">${FBNeoROMSDetailsURL}</a></br>
                  Download FULL ${system.toUpperCase()} SET:
                  <a href="${FBNeoROMSDownloadURL}${system}.zip">${system}.zip</a>`;
                break;

              case hashData.startsWith('Dreamcast/!_flycast/'):
                link = `${collectionDownloadURL}_${mainCollectionItem}/${hashData}`;
                break;

              default:
                link = `${collectionDownloadURL}_${mainCollectionItem}/${hashData}`;
            }

            retroHashNode.insertAdjacentHTML("beforeend", `<div><b><a href="${link}">Download ${fileName}</a></b></div>`);
          }
        } catch (err) {
          console.error("Error processing hash data:", err);
        }
      }
    }
  }
};
