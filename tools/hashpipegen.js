const fs = require("fs");
const path = require("path");
const axios = require("axios");

async function generateHashes() {
  console.error("--- Running Hash Generation ---");
  const allGameHashes = {};
  const nonMatchingHashes = {};
  const raApiKey = process.env.RA_API_KEY;

  if (!raApiKey) {
    throw new Error("RA_API_KEY environment variable not set.");
  }

  async function fetchSaveGameHashes(gameId) {
    try {
      const apiUrl = `https://retroachievements.org/API/API_GetGameHashes.php?i=${gameId}&y=${raApiKey}`;
      const gameApiUrl = `https://retroachievements.org/API/API_GetGame.php?i=${gameId}&y=${raApiKey}`;

      let hashResponse, gameResponse;
      try {
        [hashResponse, gameResponse] = await Promise.all([
          axios.get(apiUrl, { timeout: 10000 }),
          axios.get(gameApiUrl, { timeout: 10000 }),
        ]);
      } catch (err) {
        console.error(
          `Error fetching API data for game ID ${gameId}:`,
          err.message
        );
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));

      const results = hashResponse.data.Results || [];
      const gameData = gameResponse.data;
      const consoleName = gameData.ConsoleName || "Unknown";

      const hashesWithUrls = await Promise.all(
        results.map(async (hashInfo) => {
        const excludedLabels = ["legacy", "elf"];
        if (
          !hashInfo.Name || 
          excludedLabels.some(label => hashInfo.Labels.includes(label)) ||
          hashInfo.Name.includes("[legacy]") ||
          hashInfo.Name.includes("[elf]")
        ) {
          continue;
        }
          let romUrl;
          try {
            romUrl = await checkFileExists(
              hashInfo.Name,
              consoleName,
              hashInfo.Labels,
              hashInfo.Name
            );
          } catch (err) {
            console.error(
              "Error checking file existence for",
              hashInfo.Name,
              err.message
            );
            if (!nonMatchingHashes[gameId]) {
              nonMatchingHashes[gameId] = {};
            }
            nonMatchingHashes[gameId][hashInfo.MD5.toUpperCase()] =
              `${hashInfo.Name} - ${hashInfo.Labels}`;
            return null;
          }

          if (
            romUrl &&
            (romUrl.startsWith("https://myrient.erista.me/") ||
              romUrl.startsWith("https://archive.org/"))
          ) {
            return { [hashInfo.MD5.toUpperCase()]: romUrl };
          } else {
            if (!nonMatchingHashes[gameId]) {
              nonMatchingHashes[gameId] = {};
            }
            nonMatchingHashes[gameId][hashInfo.MD5.toUpperCase()] =
              `${hashInfo.Name} - ${hashInfo.Labels}`;
            return null;
          }
        })
      );

      const filteredHashesWithUrls = hashesWithUrls.filter(Boolean);

      if (filteredHashesWithUrls.length > 0) {
        if (!allGameHashes[gameId]) {
          allGameHashes[gameId] = [];
        }
        allGameHashes[gameId].push(
          filteredHashesWithUrls.reduce(
            (acc, curr) => ({ ...acc, ...curr }),
            {}
          )
        );
      }
    } catch (error) {
      console.error(
        `Error fetching game hashes for game ID ${gameId}:`,
        error.message
      );
    }
  }

  async function fetchRecentCompletedGameIds() {
    const url = `https://retroachievements.org/API/API_GetClaims.php?k=1&y=${raApiKey}`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);

      const claims = await res.json();

      const now = new Date();
      const setDaysAgo = new Date(
        now.getTime() - 8 * 24 * 60 * 60 * 1000
      );

      const recentClaims = claims.filter((claim) => {
        const doneTime = new Date(claim.DoneTime);
        return doneTime >= setDaysAgo;
      });

      const recentGameIds = [
        ...new Set(recentClaims.map((claim) => claim.GameID)),
      ];

      console.error("Game IDs completed in last 8 days:", recentGameIds);
      return recentGameIds;
    } catch (err) {
      console.error("Error fetching completed claims:", err.message);
      return [];
    }
  }

async function checkFileExists(fileName, consoleName, hashlabels, hashname) {
    if (!fileName || fileName.includes("[legacy]") || fileName.includes("[elf]")) {
        return null;
    }
    const dumpGroupMap = [
        { labels: ["nointro", "redump"], group: "Non-Redump" },
        { labels: ["nointro"], group: "No-Intro" },
        { labels: ["redump"], group: "Redump" },
        { labels: ["fbneo"], group: "fbneo" },
        { labels: ["wozaday"], group: "wozaday" },
        { labels: ["4amcrack"], group: "4amcrack" },
        { labels: ["cleancpc"], group: "cleancpc" },
        { labels: ["neokobe"], group: "neokobe" },
        { labels: ["lostlevel"], group: "lostlevel" },
        { labels: ["rapatches"], group: "rapatches" },
        { labels: ["mamesl"], group: "mamesl" },
        { labels: ["tosec"], group: "tosec" },
        { labels: ["goodtools"], group: "goodtools" },
        { labels: ["nongood"], group: "nongood" },
    ];

const dumpGroup = dumpGroupMap.find(entry =>
    entry.labels.every(label => hashlabels.includes(label))
)?.group || null;

    if (!dumpGroup) return null;

    const fbneoConsoleMap = {
        "Arcade": "arcade"
    };

    const cleancpcConsoleMap = {
        "Amstrad CPC": ""
    };

    const wozadayConsoleMap = {
        "Apple II": ""
    };

    const neokobeConsoleMap = {
        "NEC PC-8001": "",
        "NEC PC-8801": ""
    };

    const tosecConsoleMap = {
        "MSX": [
            "MSX/MSX/Games/[CAS]",
            "MSX/MSX/Games/[DSK]",
            "MSX/MSX/Games/[ROM]",
            "MSX/MSX/Games/[WAV]",
            "MSX/MSX/Games/[WV]"
        ],
        "MSX2": [
            "MSX/MSX2/Games/[CAS]",
            "MSX/MSX2/Games/[DSK]",
            "MSX/MSX2/Games/[HFE]",
            "MSX/MSX2/Games/[ROM]",
            "MSX/MSX2/Games/[SCP]",
            "MSX/MSX2/Games/[WAV]"
        ],
        "Apple II": [
            "Apple/II/Games/[2MG]",
            "Apple/II/Games/[A2R]",
            "Apple/II/Games/[AIF]/",
            "Apple/II/Games/[BIN]",
            "Apple/II/Games/[D13]",
            "Apple/II/Games/[DSK]",
            "Apple/II/Games/[EDD]",
            "Apple/II/Games/[FDI]",
            "Apple/II/Games/[NIB]",
            "Apple/II/Games/[PO]",
            "Apple/II/Games/[SHK]",
            "Apple/II/Games/[WAV]",
            "Apple/II/Games/[WOZ]"
        ],
        "NEC PC-8001": [
            "NEC/PC-8001/Games/[CMT]",
            "NEC/PC-8001/Games/[D88]",
            "NEC/PC-8001/Games/[T88]",
            "NEC/PC-8001/Games/[WAV]"
        ],
        "NEC PC-8801": [
            "NEC/PC-8801/Games/[CAS]",
            "NEC/PC-8801/Games/[CMT]",
            "NEC/PC-8801/Games/[D88]",
            "NEC/PC-8801/Games/[HFE]",
            "NEC/PC-8801/Games/[SCP]",
            "NEC/PC-8801/Games/[T88]",
            "NEC/PC-8801/Games/[WAV]"
        ],
        "Amstrad CPC": [
            "Amstrad/CPC/Games/[BIN]",
            "Amstrad/CPC/Games/[CPR]",
            "Amstrad/CPC/Games/[DSK]",
            "Amstrad/CPC/Games/[HXCSTREAM]",
            "Amstrad/CPC/Games/[MP3]",
            "Amstrad/CPC/Games/[RAW]",
            "Amstrad/CPC/Games/[ROM]",
            "Amstrad/CPC/Games/[SNA]",
            "Amstrad/CPC/Games/[TZX]",
            "Amstrad/CPC/Games/[WAV]"
        ]
    };

    const miscConsoleMap = {
        "Elektor TV Games Computer": ""
    };

    const redumpConsoleMap = {
        "Sega CD": "Sega - Mega CD & Sega CD",
        "Sega CD/Mega CD": "Sega - Mega CD & Sega CD",
        "PlayStation": "Sony - PlayStation",
        "GameCube": "Nintendo - GameCube - NKit RVZ [zstd-19-128k]",
        "PlayStation 2": "Sony - PlayStation 2",
        "Sega Saturn": "Sega - Saturn",
        "Dreamcast": "Sega - Dreamcast",
        "PlayStation Portable": "Sony - PlayStation Portable",
        "3DO Interactive Multiplayer": "Panasonic - 3DO Interactive Multiplayer",
        "PC-FX": "NEC - PC-FX & PC-FXGA",
        "Neo Geo CD": "SNK - Neo Geo CD",
        "TurboGrafx-CD/PC Engine CD": "NEC - PC Engine CD & TurboGrafx CD",
        "Atari Jaguar CD": "Atari - Jaguar CD Interactive Multimedia System"
    };

    const noIntroConsoleMap = {
        "Genesis/Mega Drive": [
            "Sega - Mega Drive - Genesis",
            "Sega - Mega Drive - Genesis (Aftermarket)"
         ],
        "Nintendo 64": [
            "Nintendo - Nintendo 64 (BigEndian)",
            "Nintendo - Nintendo 64 (BigEndian)  (Aftermarket)"
         ],
        "Super Nintendo/Super Famicom": [
            "Nintendo - Super Nintendo Entertainment System",
            "Nintendo - Super Nintendo Entertainment System (Aftermarket)"
        ],
        "SNES/Super Famicom": [
            "Nintendo - Super Nintendo Entertainment System",
            "Nintendo - Super Nintendo Entertainment System (Aftermarket)"
        ],
        "Sufami Turbo": "Nintendo - Sufami Turbo",
        "Satellaview": "Nintendo - Satellaview",
        "Game Boy": [
             "Nintendo - Game Boy",
             "Nintendo - Game Boy (Aftermarket)"
        ],
        "Game Boy Advance": [
             "Nintendo - Game Boy Advance",
             "Nintendo - Game Boy Advance (Aftermarket)"
        ],
        "Game Boy Color": [
             "Nintendo - Game Boy Color",
             "Nintendo - Game Boy Color (Aftermarket)"
        ],
        "NES/Famicom": [
            "Nintendo - Nintendo Entertainment System (Headered)",
            "Nintendo - Family Computer Disk System (FDS)",
            "Nintendo - Family Computer Disk System (QD)",
            "Nintendo - Nintendo Entertainment System (Headered) (Aftermarket)"
        ],
        "Famicom Disk System": [
            "Nintendo - Nintendo Entertainment System (Headered)",
            "Nintendo - Family Computer Disk System (FDS)",
            "Nintendo - Family Computer Disk System (QD)"
        ],
        "PC Engine/TurboGrafx-16": "NEC - PC Engine - TurboGrafx-16",
        "SuperGrafx": "NEC - PC Engine SuperGrafx",
        "32X": [
            "Sega - 32X",
            "Sega - 32X (Aftermarket)"
        ],
        "Master System": [
            "Sega - Master System - Mark III",
            "Sega - Master System - Mark III (Aftermarket)"
        ],
        "Atari Lynx": [
            "Atari - Atari Lynx (LYX)",
            "Atari - Atari Lynx (BLL)",
            "Atari - Atari Lynx (LNX)",
            "Atari - Atari Lynx (LYX) (Aftermarket)",
            "Atari - Atari Lynx (BLL) (Aftermarket)",
            "Atari - Atari Lynx (LNX) (Aftermarket)",
        ],
        "Neo Geo Pocket": "SNK - NeoGeo Pocket",
        "Neo Geo Pocket Color": "SNK - NeoGeo Pocket Color",
        "Game Gear": [
            "Sega - Game Gear",
            "Sega - Game Gear (Aftermarket)",
        ],
        "Atari Jaguar": [
            "Atari - Atari Jaguar (J64)",
            "Atari - Atari Jaguar (JAG)",
            "Atari - Atari Jaguar (ROM)",
            "Atari - Atari Jaguar (J64) (Aftermarket)",
            "Atari - Atari Jaguar (JAG) (Aftermarket)",
            "Atari - Atari Jaguar (ROM) (Aftermarket)"
        ],
        "Nintendo DS": [
            "Nintendo - Nintendo DS (Decrypted)",
            "Nintendo - Nintendo DS (Decrypted) (Aftermarket)"
         ],
        "Magnavox Odyssey 2": "Magnavox - Odyssey 2",
        "Pokemon Mini": [
            "Nintendo - Pokemon Mini",
            "Nintendo - Pokemon Mini (Aftermarket)"
        ],
        "Atari 2600": [
            "Atari - Atari 2600",
            "Atari - Atari 2600 (Aftermarket)"
        ],
        "Virtual Boy": [
            "Nintendo - Virtual Boy",
            "Nintendo - Virtual Boy (Aftermarket)"
        ],
        "MSX": [
            "Microsoft - MSX",
            "Microsoft - MSX (Aftermarket)"
        ],
        "MSX2": [
            "Microsoft - MSX2",
            "Microsoft - MSX2 (Aftermarket)"
        ],
        "SG-1000": [
            "Sega - SG-1000 - SC-3000",
            "Sega - SG-1000 - SC-3000 (Aftermarket)"
        ],
        "PlayStation Portable": [
            "Sony - PlayStation Portable (PSN) (Decrypted)",
            "Sony - PlayStation Portable (PSN) (Minis) (Decrypted)"
        ],
        "ColecoVision": "Coleco - ColecoVision",
        "Intellivision": [
            "Mattel - Intellivision",
            "Mattel - Intellivision (Aftermarket)",
        ],
        "Vectrex": "GCE - Vectrex",
        "Atari 7800": [
            "Atari - Atari 7800 (BIN)",
            "Atari - Atari 7800 (BIN) (Aftermarket)",
            "Atari - Atari 7800 (A78)",
            "Atari - Atari 7800 (A78) (Aftermarket)"
        ],
        "WonderSwan": [
            "Bandai - WonderSwan",
            "Bandai - WonderSwan (Aftermarket)"
        ],
        "WonderSwan Color": [
            "Bandai - WonderSwan Color",
            "Bandai - WonderSwan Color (Aftermarket)"
        ],
        "Fairchild Channel F": "Fairchild - Channel F",
        "Watara Supervision": [
            "Watara - Supervision",
            "Watara - Supervision (Aftermarket)"
        ],
        "Mega Duck": [
            "Welback - Mega Duck",
            "Welback - Mega Duck (Aftermarket)"
        ],
        "Arduboy": "Arduboy Inc - Arduboy",
        "Arcadia 2001": "Emerson - Arcadia 2001",
        "Interton VC 4000": "Interton - VC 4000",
        "Nintendo DSi": "Nintendo - Nintendo DSi (Digital)",
    };

    const nonRedumpConsoleMap = {
        "3DO Interactive Multiplayer": "Non-Redump - Panasonic - 3DO Interactive Multiplayer",
        "Atari Jaguar CD": "Non-Redump - Atari - Atari Jaguar CD",
        "Dreamcast": [
            "Non-Redump - Sega - Dreamcast",
            "Non-Redump - Sega - Dreamcast (Aftermarket)"
        ],
        "GameCube": "Non-Redump - Nintendo - Nintendo GameCube",
        "PC-8000/8800": "Non-Redump - NEC - PC-88",
        "PC Engine CD/TurboGrafx-CD": [
            "Non-Redump - NEC - PC Engine CD + TurboGrafx CD",
            "Non-Redump - NEC - PC Engine CD + TurboGrafx CD (Aftermarket)"
        ],
        "PlayStation": "Non-Redump - Sony - PlayStation",
        "PlayStation 2": "Non-Redump - Sony - PlayStation 2",
        "PlayStation Portable": "Non-Redump - Sony - PlayStation Portable",
        "Saturn": "Non-Redump - Sega - Sega Saturn",
        "PC Engine/TurboGrafx-16": [
            "NEC - PC Engine - TurboGrafx 16",
            "NEC - PC Engine - TurboGrafx 16 (Aftermarket)"
        ],
        "Sega CD": [
            "Non-Redump - Sega - Sega Mega CD + Sega CD",
            "Non-Redump - Sega - Sega Mega CD + Sega CD (Aftermarket)"
        ],
        "Wii": "Non-Redump - Nintendo - Wii",
        "Wii U": "Non-Redump - Nintendo - Wii U"
    };

    const homebrewConsoleMap = {
        "WASM-4": "",
        "Uzebox": ""
    };

    const lostLevelConsoleMap = {
        "WASM-4": "",
        "Uzebox": ""
    };

    const consoleMapLookup = {
        "Non-Redump": nonRedumpConsoleMap,
        "No-Intro": noIntroConsoleMap,
        "Redump": redumpConsoleMap,
        "fbneo": fbneoConsoleMap,
        "wozaday": wozadayConsoleMap,
        "4amcrack": {},
        "cleancpc": cleancpcConsoleMap,
        "neokobe": neokobeConsoleMap,
        "lostlevel": lostLevelConsoleMap,
        "rapatches": {},
        "mamesl": {},
        "tosec": tosecConsoleMap,
        "goodtools": miscConsoleMap,
        "nongood": {}
    };


    consoleMap = consoleMapLookup[dumpGroup] || null;

    const consoleEntry = consoleMap?.[consoleName] || consoleName;
    const formattedConsoleNames = Array.isArray(consoleEntry) ? consoleEntry : [consoleEntry];

    const cleanedFileName = fileName.replace(/\.[^.]+$/, "");
    const fileCandidates = [cleanedFileName + ".zip", fileName + ".zip"];

    let basePath;
    switch (dumpGroup) {
      case "Redump":
        basePath = "Redump";
        break;
      case "fbneo":
        basePath = "Internet Archive/chadmaster/fbnarcade-fullnonmerged";
        break;
      case "No-Intro":
      case "Non-Redump":
        basePath = "No-Intro";
        break;
      default:
        basePath = dumpGroup;
    }

    for (const folder of formattedConsoleNames) {
      const cleanFolder = folder.replace(/\/+$/, "");
      const baseUrl = `https://myrient.erista.me/files/${basePath}/${cleanFolder}/`;
      for (const candidate of fileCandidates) {
        const url = baseUrl + candidate;
        try {
          const response = await axios.head(url, { timeout: 5000 });
          if (response.status === 200) {
            return url;
          }
        } catch (err) {
        }
      }
    }

    return null;
  }

  const idArray = await fetchRecentCompletedGameIds();

  if (!Array.isArray(idArray) || idArray.length === 0) {
    console.error("No game IDs to process");
    return { allGameHashes, nonMatchingHashes };
  }

  for (const id of idArray) {
    console.error(`Processing ID: ${id}`);
    await fetchSaveGameHashes(id);
  }

  console.error("--- Hash Generation Complete ---");
  return { allGameHashes, nonMatchingHashes };
}

function mergeHashes(allGameHashes) {
  console.error("--- Running Hash Merge ---");
  const hashlinksPath = path.join(__dirname, "../hashlinks.json");
  const hashlinks2 = JSON.parse(fs.readFileSync(hashlinksPath, "utf-8"));
  let filenames = [];

  function cleanCategoryName(name) {
    return name
      .replace(/\s*\(.*?\)/g, "")
      .replace(/\s*\[.*?\]/g, "")
      .replace(/\s*-\s*NKit RVZ.*$/i, "")
      .trim();
  }

  Object.keys(allGameHashes).forEach((id) => {
    if (!hashlinks2[id]) hashlinks2[id] = [{}];
    const gameHashes = allGameHashes[id];
    const processEntry = (url, id, hash) => {
      if (!hashlinks2[id][0][hash]) {
        hashlinks2[id][0][hash] = url;
        const match = url.match(/\/files\/(.+)/);
        if (match) {
          let cleanPath = match[1]
            .replace(
              /^Internet Archive\/chadmaster\/fbnarcade-fullnonmerged\//,
              ""
            )
            .replace(/^No-Intro\//, "")
            .replace(/^Redump\//, "");
          filenames.push(cleanPath);
        }
      }
    };

    if (Array.isArray(gameHashes)) {
      gameHashes.forEach((hashInfo) => {
        Object.keys(hashInfo).forEach((hash) =>
          processEntry(hashInfo[hash], id, hash)
        );
      });
    } else if (typeof gameHashes === "object") {
      Object.keys(gameHashes).forEach((hash) =>
        processEntry(gameHashes[hash], id, hash)
      );
    }
  });

  filenames = [...new Set(filenames)];
  filenames = filenames.map((f) => f.replace(/\.[^.]+$/, ""));
  filenames.sort((a, b) => {
    const [catA, ...restA] = a.split("/");
    const [catB, ...restB] = b.split("/");
    return (
      catA.localeCompare(catB, undefined, { sensitivity: "base" }) ||
      restA
        .join("/")
        .localeCompare(restB.join("/"), undefined, { sensitivity: "base" })
    );
  });

  const grouped = {};
  filenames.forEach((file) => {
    const parts = file.split("/");
    const mainCategory = cleanCategoryName(parts.shift());
    if (!grouped[mainCategory]) grouped[mainCategory] = {};
    let current = grouped[mainCategory];
    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        if (!current.files) current.files = [];
        current.files.push(part);
      } else {
        if (!current[part]) current[part] = {};
        current = current[part];
      }
    });
  });

  function buildOutput(obj, prefix = "") {
    let output = "";
    Object.keys(obj)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
      .forEach((key) => {
        if (key === "files") {
          obj.files
            .sort((a, b) =>
              a.localeCompare(b, undefined, { sensitivity: "base" })
            )
            .forEach((file) => {
              output += ` - ${file}\n`;
            });
        } else {
          output += `${prefix}${key}:\n`;
          output += buildOutput(obj[key], prefix + "  ");
          output += "\n";
        }
      });
    return output;
  }

  const formattedOutput = buildOutput(grouped);
  fs.writeFileSync(hashlinksPath, JSON.stringify(hashlinks2, null, 2));
  console.error("Merged data saved to hashlinks.json");
  console.error("--- Hash Merge Complete ---");
  return formattedOutput.trim();
}

function mergeFailedHashes(failedGameHashes) {
  console.error("--- Running Failed Hash Merge ---");
  const missingHashesPath = path.join(__dirname, "../missinghashes.json");

  function loadJson(filePath) {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf8");
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error(`Error parsing JSON from ${filePath}:`, e);
        return {};
      }
    }
    return {};
  }

  function mergeJson(data1, data2) {
    const merged = { ...data1 };
    Object.entries(data2).forEach(([key, values]) => {
      key = String(Number(key));
      if (!merged[key]) {
        merged[key] = {};
      }
      Object.entries(values).forEach(([hashValue, description]) => {
        if (!merged[key][hashValue]) {
          merged[key][hashValue] = description;
        }
      });
    });
    return Object.fromEntries(
      Object.entries(merged).sort(([a], [b]) => Number(a) - Number(b))
    );
  }

  const data1 = loadJson(missingHashesPath);
  const mergedData = mergeJson(data1, failedGameHashes);
  fs.writeFileSync(
    missingHashesPath,
    JSON.stringify(mergedData, null, 2),
    "utf8"
  );
  console.error(`Merged JSON saved to ${missingHashesPath}`);
  console.error("--- Failed Hash Merge Complete ---");
}

function removeFoundHashes() {
  console.error("--- Running Hash Removal ---");
  const missingHashesPath = path.join(__dirname, "../missinghashes.json");
  const hashlinksPath = path.join(__dirname, "../hashlinks.json");
  const missingHashes = JSON.parse(fs.readFileSync(missingHashesPath, "utf-8"));
  const hashlinks = JSON.parse(fs.readFileSync(hashlinksPath, "utf-8"));

  Object.keys(missingHashes).forEach((id) => {
    if (Array.isArray(hashlinks[id])) {
      Object.keys(missingHashes[id]).forEach((hash) => {
        const exists = hashlinks[id].some(
          (obj) => obj && typeof obj === "object" && obj.hasOwnProperty(hash)
        );
        if (exists) {
          delete missingHashes[id][hash];
        }
      });
      if (Object.keys(missingHashes[id]).length === 0) {
        delete missingHashes[id];
      }
    }
  });

  fs.writeFileSync(missingHashesPath, JSON.stringify(missingHashes, null, 2));
  console.error(
    "Updated missinghashes.json: Removed hashes that exist in hashlinks.json."
  );
  console.error("--- Hash Removal Complete ---");
}

function updateReadmeCount() {
  console.error("--- Running README Count Update ---");

  function countMd5Entries(filePath) {
    try {
      const data = fs.readFileSync(filePath, "utf8");
      const jsonData = JSON.parse(data);
      let md5Count = 0;

      Object.values(jsonData).forEach((value) => {
        if (Array.isArray(value)) {
          value.forEach((entry) => {
            if (typeof entry === "object" && entry !== null) {
              md5Count += Object.keys(entry).length;
            }
          });
        } else if (typeof value === "object" && value !== null) {
          md5Count += Object.keys(value).length;
        }
      });

      console.error(
        `Counted ${md5Count.toLocaleString("en-US")} MD5 entries in ${filePath}`
      );
      return md5Count;
    } catch (err) {
      console.error(`Error reading or parsing ${filePath}:`, err);
      return 0;
    }
  }

  const linkedHashes = countMd5Entries(
    path.join(__dirname, "../hashlinks.json")
  );
  const missingHashes = countMd5Entries(
    path.join(__dirname, "../missinghashes.json")
  );
  const mdFilePath = path.join(__dirname, "../README.md");
  const now = new Date();
  const dateUTC = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

  const formattedDate = dateUTC.replace(
    /(\w+)\s(\d+),\s(\d+)/,
    (match, month, day, year) => {
      return `${month}. ${day}, ${year}`;
    }
  );

  try {
    let mdContent = fs.readFileSync(mdFilePath, "utf8");
    const linkedHashesFormatted = linkedHashes.toLocaleString("en-US");
    const missingHashesFormatted = missingHashes.toLocaleString("en-US");
    const regexPattern =
      /## 🔗 Linked Hash Status \(as of [^\)]+\)\s*- \*\*Linked Hashes:\*\* [\d,]+\s*- \*\*Missing Hashes:\*\* [\d,]+/s;
    const replacementText = `## 🔗 Linked Hash Status (as of ${formattedDate})\n- **Linked Hashes:** ${linkedHashesFormatted}\n- **Missing Hashes:** ${missingHashesFormatted}`;

    if (regexPattern.test(mdContent)) {
      mdContent = mdContent.replace(regexPattern, replacementText);
      fs.writeFileSync(mdFilePath, mdContent, "utf8");
      console.error("README.md updated successfully.");
    } else {
      console.error("Failed to update README.md: Pattern not found.");
    }
  } catch (err) {
    console.error("Error updating README.md:", err);
  }
  console.error("--- README Count Update Complete ---");
}

async function main() {
  const { allGameHashes, nonMatchingHashes } = await generateHashes();
  const commitMessageBody = mergeHashes(allGameHashes);
  mergeFailedHashes(nonMatchingHashes);
  removeFoundHashes();
  updateReadmeCount();

  const commitTitle = "Update game hash links";

  if (commitMessageBody) {
    console.log(`${commitTitle}\n\n${commitMessageBody}`);
  }
}

main().catch((err) => {
  console.error("An error occurred during the hash pipeline execution:", err);
});
