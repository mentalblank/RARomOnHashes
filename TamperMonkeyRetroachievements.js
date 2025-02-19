// ==UserScript==
// @name         Rom Download on RA Hash List
// @namespace    https://github.com/MentalBlank/RARomOnHashesUserScript
// @updateURL    https://raw.githubusercontent.com/MentalBlank/RARomOnHashesUserScript/refs/heads/main/TamperMonkeyRetroachievements.js
// @downloadURL  https://raw.githubusercontent.com/MentalBlank/RARomOnHashesUserScript/refs/heads/main/TamperMonkeyRetroachievements.js
// @version      1.0.0
// @description  Add download links to retroachievements.org Supported Game Files page e.g. https://retroachievements.org/game/19339/hashes
// @author       MentalBlank
// @match        https://retroachievements.org/game/*/hashes
// @icon         https://static.retroachievements.org/assets/images/favicon.webp
// @grant        none
// @run-at       document-end
// ==/UserScript==

//
// CHANGELOG:
// 1.0.0: Initial Release based on outdated wholee script
//

'use strict';

// Add delay function
function delayAction(callback, delayTime) {
    setTimeout(callback, delayTime);  // delayTime is in milliseconds
}

if (document.readyState === 'loading') {
    // If the DOM is still loading, add event listener and wait for DOMContentLoaded
    document.addEventListener("DOMContentLoaded", function() {
        delayAction(onDomLoaded, 500);  // Delay for 2000 milliseconds (2 seconds)
    });
} else {
    // If DOM is already loaded, execute the function with delay immediately
    delayAction(onDomLoaded, 500);  // Delay for 2000 milliseconds (2 seconds)
}

function onDomLoaded() {
  console.log("Rom Download on RA Hash List Script is running!");
  const separateCollectionItems = ['NES-Famicom', 'SNES-Super Famicom', 'PlayStation', 'PlayStation 2', 'PlayStation Portable', 'GameCube'];
  const collectionDownloadURL = 'https://raw.githubusercontent.com/MentalBlank/RARomOnHashesUserScript/refs/heads/main/';
  const retroachievementsHashList = collectionDownloadURL + 'hashlinks.json';
  const updateInterval = 86400; // 24 hours in seconds
  const currentUnixTimestamp = Math.floor(Date.now() / 1000);  // current timestamp in seconds
  const collectionLastUpdated = parseInt(localStorage.getItem('collectionLastUpdated')) / 1000;  // Convert to seconds
  const collectionLastModified = parseInt(localStorage.getItem('collectionLastModified'));

  // GitHub API to get the last commit date for the file and check for updates
  const apiUrl = 'https://api.github.com/repos/MentalBlank/RARomOnHashesUserScript/commits?path=hashlinks.json';
  if (isNaN(collectionLastUpdated) || currentUnixTimestamp > collectionLastUpdated + updateInterval) {
    // Fetch the last commit date for the file using GitHub API
    fetch(apiUrl)
      .then(response => response.json())
      .then(commits => {
        if (!commits || commits.length === 0) {
          throw new Error("Can't get last commit date from GitHub.");
        }
        // Get the last commit date from the latest commit
        const lastCommitDate = new Date(commits[0].commit.committer.date).getTime();

        // Store timestamps in milliseconds
        if (lastCommitDate === collectionLastModified) {
          // File hasn't been modified, use cached data
          localStorage.setItem('collectionLastUpdated', Date.now()); // Store in milliseconds
          injectArchiveGames(JSON.parse(localStorage.getItem('collectionROMList')));
        } else {
          // File has been updated, fetch the new hashlinks.json
          const corsProxy = "https://corsproxy.io/?url=";
          fetch(corsProxy + retroachievementsHashList, { cache: 'no-cache' })
            .then(response => response.json())
            .then(output => {
              injectArchiveGames(output);
              localStorage.setItem('collectionROMList', JSON.stringify(output));
              localStorage.setItem('collectionLastUpdated', Date.now()); // Store in milliseconds
              localStorage.setItem('collectionLastModified', lastCommitDate);
            })
            .catch(error => {
              console.error(error);
              injectArchiveGames(null, true, "Can't get retroachievements hash list from github.com. Please try again later.");
              localStorage.removeItem('collectionLastModified');
              localStorage.removeItem('collectionLastUpdated');
              localStorage.removeItem('collectionROMList');
            });
        }
      })
      .catch(error => {
        console.error(error);
        injectArchiveGames(null, true, "Can't get required information from github.com. Please try again later.");
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
  let gameId = window.location.pathname.split("/")[2]; // Extract Game ID

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

    let retroHash = retroHashElement.innerText.trim().toUpperCase(); // Normalize Hash
    retroHashElement.innerText = retroHash; // Ensure Correct Hash Formatting

    if (boolArchiveOrgDown) {
      retroHashNode.insertAdjacentHTML("beforeend", `<b>${message}</b>`);
    } else {
      try {
        let romList = gameData[gameId]; // Get ROM list for this game

        for (let i = 0; i < romList.length; i++) {
          let hashData = romList[i]; // Get hash-URL mapping

          if (retroHash in hashData) {
            let romURL = hashData[retroHash]; // Extract Correct URL

            // Ensure we are using the full external link instead of a relative path
            if (!romURL.startsWith("http")) {
              console.error(`Invalid ROM URL: ${romURL}`);
              continue;
            }

            let fileName = romURL.substring(romURL.lastIndexOf('/') + 1); // Extract File Name

            retroHashNode.insertAdjacentHTML("beforeend", `
              <div>
                <b><a href="${romURL}" target="_blank">Download ${fileName}</a></b>
              </div>
            `);
            break; // Stop looping once we find the first match
          }
        }
      } catch (err) {
        console.error("Error processing hash data:", err);
      }
    }
  }
}

};
