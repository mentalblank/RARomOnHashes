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

      await new Promise((resolve) => setTimeout(resolve, 10000));

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
          hashInfo.Name.includes("[elf]") ||
          consoleName.includes("Hubs")
        ) {
          return null;
          return null;
        }
          let romUrl;
          try {
            romUrl = await checkFileExists(
              hashInfo.Name.trim(),
              consoleName,
              hashInfo.Labels,
              hashInfo.Name.trim()
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
              `${hashInfo.Name} - ${consoleName} - ${hashInfo.Labels} - ${hashInfo.PatchUrl}`;
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
              `${hashInfo.Name} - ${consoleName} - ${hashInfo.Labels} - ${hashInfo.PatchUrl}`;
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

  const claimUrls = [
    `https://retroachievements.org/API/API_GetClaims.php?k=1&y=${raApiKey}`,
    `https://retroachievements.org/API/API_GetClaims.php?k=2&y=${raApiKey}`,
    `https://retroachievements.org/API/API_GetClaims.php?k=3&y=${raApiKey}`,
    `https://retroachievements.org/API/API_GetActiveClaims.php?y=${raApiKey}`
  ];

  try {
    const now = new Date();
    const cutoff = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);

    let allClaims = [];

    for (const url of claimUrls) {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const claims = await res.json();

      const dateField = url.includes("ActiveClaims") ? "ClaimedAt" : "DoneTime";

      const recentClaims = claims.filter((c) => new Date(c[dateField]) >= cutoff);
      allClaims = allClaims.concat(recentClaims);
    }

    const uniqueIds = [...new Set(allClaims.map((c) => c.GameID))];

    console.error("Unique Game IDs (last 8 days):", uniqueIds);
    return uniqueIds;
  } catch (err) {
    console.error("Error fetching claims:", err.message);
    return [];
  }
}


async function checkFileExists(fileName, consoleName, hashlabels, hashname) {
    if (!fileName || fileName.includes("[legacy]") || fileName.includes("[elf]") || consoleName.includes("Hubs")) {
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
        "Arcade": ["", "arcade"],
        "Fairchild Channel F": ["","channelf"],
        "ColecoVision": ["","coleco"],
        "Game Gear": ["","gamegear"],
        "Genesis/Mega Drive": ["","megadrive"],
        "MSX": ["","msx"],
        "NES/Famicom": ["","nes"],
        "Neo Geo Pocket": ["","ngp"],
        "PC Engine/TurboGrafx-16": ["","pce"],
        "SG-1000": ["","sg1000"],
        "SNES/Super Famicom": ["","snes"],
    };

    const cleancpcConsoleMap = {
        "Amstrad CPC": ""
    };

    const wozadayConsoleMap = {
        "Apple II": ""
    };

    const neokobeConsoleMap = {
        "PC-8000/8800": ""
    };

    const tosecConsoleMap = {
        "32X": [
            "TOSEC/Sega/32X/Games",
            "TOSEC/Sega/32X/Homebrew/Games",
        ],
        "Amstrad CPC": [
            "TOSEC/Amstrad/CPC/Games/[BIN]",
            "TOSEC/Amstrad/CPC/Games/[CPR]",
            "TOSEC/Amstrad/CPC/Games/[DSK]",
            "TOSEC/Amstrad/CPC/Games/[HXCSTREAM]",
            "TOSEC/Amstrad/CPC/Games/[MP3]",
            "TOSEC/Amstrad/CPC/Games/[RAW]",
            "TOSEC/Amstrad/CPC/Games/[ROM]",
            "TOSEC/Amstrad/CPC/Games/[SNA]",
            "TOSEC/Amstrad/CPC/Games/[TZX]",
            "TOSEC/Amstrad/CPC/Games/[WAV]"
        ],
        "Apple II": [
            "TOSEC/Apple/II/Games/[2MG]",
            "TOSEC/Apple/II/Games/[A2R]",
            "TOSEC/Apple/II/Games/[AIF]",
            "TOSEC/Apple/II/Games/[BIN]",
            "TOSEC/Apple/II/Games/[D13]",
            "TOSEC/Apple/II/Games/[DSK]",
            "TOSEC/Apple/II/Games/[EDD]",
            "TOSEC/Apple/II/Games/[FDI]",
            "TOSEC/Apple/II/Games/[NIB]",
            "TOSEC/Apple/II/Games/[PO]",
            "TOSEC/Apple/II/Games/[SHK]",
            "TOSEC/Apple/II/Games/[WAV]",
            "TOSEC/Apple/II/Games/[WOZ]"
        ],
        "Arcadia 2001": "TOSEC/Emerson/Arcadia 2001/Games",
        "Arduboy": [
            "TOSEC/Arduboy/Arduboy/Games/[HEX]",
            "TOSEC/Arduboy/Arduboy/Games/[ARDUBOY]",
        ],
        "Atari 2600": [
            "TOSEC/Atari/2600 & VCS/Games",
            "TOSEC/Atari/2600 & VCS/Homebrew/Games/[BIN]",
            "TOSEC/Atari/2600 & VCS/Homebrew/Games/[WAV]",
            "TOSEC/Atari/2600 & VCS/Homebrew/Games/AtariAge Design Contest",
        ],
        "Atari 7800": [
            "TOSEC/Atari/7800/Games",
            "TOSEC/Atari/7800/Homebrew/Games",
        ],
        "Atari Jaguar": [
            "TOSEC/Atari/Jaguar/Games/[ROM]",
            "TOSEC/Atari/Jaguar/Games/[J64]",
            "TOSEC/Atari/Jaguar/Games/[BIN]",
            "TOSEC/Atari/Jaguar/Games/[JAG]",
            "TOSEC/Atari/Jaguar/Games/[Multipart]",
            "TOSEC/Atari/Jaguar/Homebrew/Games/[ABS]",
            "TOSEC/Atari/Jaguar/Homebrew/Games/[BIN]",
            "TOSEC/Atari/Jaguar/Homebrew/Games/[BJL]",
            "TOSEC/Atari/Jaguar/Homebrew/Games/[J64]",
            "TOSEC/Atari/Jaguar/Homebrew/Games/[JAG]",
            "TOSEC/Atari/Jaguar/Homebrew/Games/[ROM]",
        ],
        "Atari Lynx": [
            "TOSEC/Atari/Lynx/Games/[LNX]",
            "TOSEC/Atari/Lynx/Games/[LYX]",
            "TOSEC/Atari/Lynx/Games/[O]",
            "TOSEC/Atari/Lynx/Homebrew/Games/[LNX]",
            "TOSEC/Atari/Lynx/Homebrew/Games/[O]",
        ],
        "ColecoVision": [
            "TOSEC/Coleco/ColecoVision/Games",
            "TOSEC/Coleco/ColecoVision/Homebrew/Games",
        ],
        "Fairchild Channel F": "TOSEC/Fairchild/VES & Channel F/Games",
        "Game Boy": [
            "TOSEC/Nintendo/Game Boy/Games",
            "TOSEC/Nintendo/Game Boy/Homebrew/Games",
        ],
        "Game Boy Advance": [
            "TOSEC/Nintendo/Game Boy Advance/Games",
            "TOSEC/Nintendo/Game Boy Advance/Homebrew/Games",
        ],
        "Game Boy Color": [
            "TOSEC/Nintendo/Game Boy Color/Games/[GBC]",
            "TOSEC/Nintendo/Game Boy Color/Homebrew/Games",
            "TOSEC/Nintendo/Game Boy Color/Games/[GBX]",
        ],
        "Game Gear": "TOSEC/Sega/Game Gear/Homebrew/Games",
        "Genesis/Mega Drive": [
            "TOSEC/Sega/Mega Drive & Genesis/Games/[BIN]",
            "TOSEC/Sega/Mega Drive & Genesis/Homebrew/Games",
            "TOSEC/Sega/Mega Drive & Genesis/Games/[Multipart]",
        ],
        "Intellivision": [
            "TOSEC/Mattel/Intellivision/Games/[BIN]",
            "TOSEC/Mattel/Intellivision/Games/[Multipart]",
        ],
        "Magnavox Odyssey 2": "TOSEC/Magnavox/Odyssey2/Games",
        "Master System": [
            "TOSEC/Sega/Mark III & Master System/Games",
            "TOSEC/Sega/Mark III & Master System/Homebrew/Games",
        ],
        "Mega Duck": [
            "TOSEC/Creatronic/Mega Duck & Cougar Boy/Games",
            "TOSEC/Creatronic/Mega Duck & Cougar Boy/Homebrew/Games",
        ],
        "MSX": [
            "TOSEC/MSX/MSX/Games/[CAS]",
            "TOSEC/MSX/MSX/Games/[DSK]",
            "TOSEC/MSX/MSX/Games/[ROM]",
            "TOSEC/MSX/MSX/Games/[WAV]",
            "TOSEC/MSX/MSX/Games/[WV]",
            "TOSEC/MSX/MSX2/Games/[CAS]",
            "TOSEC/MSX/MSX2/Games/[DSK]",
            "TOSEC/MSX/MSX2/Games/[HFE]",
            "TOSEC/MSX/MSX2/Games/[ROM]",
            "TOSEC/MSX/MSX2/Games/[SCP]",
            "TOSEC/MSX/MSX2/Games/[WAV]",
        ],
        "Neo Geo Pocket": [
            "TOSEC/SNK/Neo-Geo Pocket/Games",
            "TOSEC/SNK/Neo-Geo Pocket Color/Games",
        ],
        "NES/Famicom": [
            "TOSEC/Nintendo/Famicom & Entertainment System/Games/[NES]",
            "TOSEC/Nintendo/Famicom & Entertainment System/Homebrew/Games",
        ],
        "Nintendo 64": "TOSEC/Nintendo/64/Games",
        "Nintendo DS": [
            "TOSEC/Nintendo/DS/Games",
            "TOSEC/Nintendo/DS/Homebrew/Games",
        ],
        "Nintendo DSi": "TOSEC/Nintendo/DSi/Games",
        "PC-8000/8800": [
            "TOSEC/NEC/PC-8001/Games/[CMT]",
            "TOSEC/NEC/PC-8001/Games/[D88]",
            "TOSEC/NEC/PC-8001/Games/[T88]",
            "TOSEC/NEC/PC-8001/Games/[WAV]",
            "TOSEC/NEC/PC-8801/Games/[CAS]",
            "TOSEC/NEC/PC-8801/Games/[CMT]",
            "TOSEC/NEC/PC-8801/Games/[D88]",
            "TOSEC/NEC/PC-8801/Games/[HFE]",
            "TOSEC/NEC/PC-8801/Games/[SCP]",
            "TOSEC/NEC/PC-8801/Games/[T88]",
            "TOSEC/NEC/PC-8801/Games/[WAV]"
        ],
        "PC Engine/TurboGrafx-16": [
            "TOSEC/NEC/PC-Engine & TurboGrafx-16/Games",
            "TOSEC/NEC/PC-Engine & TurboGrafx-16/Homebrew/Games",
        ],
        "Pokemon Mini": "TOSEC/Nintendo/Pokemon Mini/Games",
        "SG-1000": [
            "TOSEC/Sega/Game 1000/Games",
            "TOSEC/Sega/Game 1000/Homebrew/Games",
        ],
        "SNES/Super Famicom": "TOSEC/Nintendo/Super Famicom & Super Entertainment System/Games",
        "Vectrex": "TOSEC/GCE/Vectrex/Games",
        "Virtual Boy": "TOSEC/Nintendo/Virtual Boy/Games",
        "Watara Supervision": [
            "TOSEC/Watara/Supervision/Games",
            "TOSEC/Watara/Supervision/Homebrew/Games",
        ],
        "WonderSwan": [
            "TOSEC/Bandai/WonderSwan/Games",
            "TOSEC/Bandai/WonderSwan Color/Games",
        ],
        "3DO Interactive Multiplayer": "TOSEC-ISO/Sega/32X/CD/Games/[ISO]",
        "Atari Jaguar CD": "TOSEC-ISO/Atari/Jaguar CD/Games",
        "Dreamcast": [
            "TOSEC-ISO/Sega/Dreamcast/Games/US",
            "TOSEC-ISO/Sega/Dreamcast/Games/PAL",
            "TOSEC-ISO/Sega/Dreamcast/Games/JP",
            "TOSEC-ISO/Sega/Dreamcast/Games/[CDI]",
            "TOSEC-ISO/Sega/Dreamcast/Homebrew/Games/[CDI]",
        ],
        "Neo Geo CD": [
            "TOSEC-ISO/SNK/Neo-Geo CD/Games/[ISO]",
            "TOSEC-ISO/SNK/Neo-Geo CD/Games/[IMG]",
        ],
        "GameCube": "TOSEC-ISO/Nintendo/GameCube/Games",
        "PC-FX": "TOSEC-ISO/NEC/PC-FX/Games",
        "PC Engine CD/TurboGrafx-CD": "TOSEC-ISO/NEC/PC-Engine CD & TurboGrafx-16 CD/Games/[IMG]",
        "PlayStation": [
            "TOSEC-ISO/Sony/PlayStation/Games/[BIN]",
            "TOSEC-ISO/Sony/PlayStation/Homebrew/Games/[BIN]",
            "TOSEC-ISO/Sony/PlayStation/Homebrew/Games/[ISO]",
        ],
        "PlayStation 2": [
            "TOSEC-ISO/Sony/PlayStation 2/Games/PAL/[ISO]",
            "TOSEC-ISO/Sony/PlayStation 2/Games/JP/[ISO]",
        ],
        "PlayStation Portable": [
            "TOSEC-ISO/Sony/PlayStation Portable/Games/[ISO]",
            "TOSEC-ISO/Sony/PlayStation Portable/Homebrew/Games/[ISO]",
        ],
        "Saturn": [
            "TOSEC-ISO/Sega/Saturn/Games/[ISO]",
            "TOSEC-ISO/Sega/Saturn/Games/[BIN]",
            "TOSEC-ISO/Sega/Saturn/Homebrew/Games/[ISO]",
        ],
        "Sega CD": [
            "TOSEC-ISO/Sega/Mega-CD & Sega CD/CD/Games/[ISO]",
            "TOSEC-ISO/Sega/Mega-CD & Sega CD/CD/Games/[IMG]",
        ],
    };

    const miscConsoleMap = {
        "Elektor TV Games Computer": ""
    };

    const redumpConsoleMap = {
        "3DO Interactive Multiplayer": "Panasonic - 3DO Interactive Multiplayer",
        "Atari Jaguar CD": "Atari - Jaguar CD Interactive Multimedia System",
        "Dreamcast": "Sega - Dreamcast",
        "GameCube": "Nintendo - GameCube - NKit RVZ [zstd-19-128k]",
        "Neo Geo CD": "SNK - Neo Geo CD",
        "PC-FX": "NEC - PC-FX & PC-FXGA",
        "PC Engine CD/TurboGrafx-CD": "NEC - PC Engine CD & TurboGrafx CD",
        "PlayStation": "Sony - PlayStation",
        "PlayStation 2": "Sony - PlayStation 2",
        "PlayStation Portable": "Sony - PlayStation Portable",
        "Sega CD": "Sega - Mega CD & Sega CD",
        "Saturn": "Sega - Saturn",
        "Wii": "Nintendo - Wii - NKit RVZ [zstd-19-128k]"
    };

    const noIntroConsoleMap = {
        "32X": [
            "Sega - 32X",
            "Sega - 32X (Aftermarket)"
        ],
        "3DO Interactive Multiplayer": "Non-Redump - Panasonic - 3DO Interactive Multiplayer",
        "Arcadia 2001": "Emerson - Arcadia 2001",
        "Arduboy": "Arduboy Inc - Arduboy",
        "Atari 2600": [
            "Atari - Atari 2600",
            "Atari - Atari 2600 (Aftermarket)"
        ],
        "Atari 7800": [
            "Atari - Atari 7800 (BIN)",
            "Atari - Atari 7800 (BIN) (Aftermarket)",
            "Atari - Atari 7800 (A78)",
            "Atari - Atari 7800 (A78) (Aftermarket)"
        ],
        "Atari Jaguar": [
            "Atari - Atari Jaguar (J64)",
            "Atari - Atari Jaguar (JAG)",
            "Atari - Atari Jaguar (ROM)",
            "Atari - Atari Jaguar (J64) (Aftermarket)",
            "Atari - Atari Jaguar (JAG) (Aftermarket)",
            "Atari - Atari Jaguar (ROM) (Aftermarket)"
        ],
        "Atari Jaguar CD": "Non-Redump - Atari - Atari Jaguar CD",
        "Atari Lynx": [
            "Atari - Atari Lynx (LYX)",
            "Atari - Atari Lynx (BLL)",
            "Atari - Atari Lynx (LNX)",
            "Atari - Atari Lynx (LYX) (Aftermarket)",
            "Atari - Atari Lynx (BLL) (Aftermarket)",
            "Atari - Atari Lynx (LNX) (Aftermarket)",
        ],
        "ColecoVision": "Coleco - ColecoVision",
        "Commodore 64": "Commodore - Commodore 64",
        "Dreamcast": [
            "Non-Redump - Sega - Dreamcast",
            "Non-Redump - Sega - Dreamcast (Aftermarket)"
        ],
        "Fairchild Channel F": "Fairchild - Channel F",
        "Famicom Disk System": [
            "Nintendo - Nintendo Entertainment System (Headered)",
            "Nintendo - Family Computer Disk System (FDS)",
            "Nintendo - Family Computer Disk System (QD)"
        ],
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
        "GameCube": "Non-Redump - Nintendo - Nintendo GameCube",
        "Game Gear": [
            "Sega - Game Gear",
            "Sega - Game Gear (Aftermarket)",
        ],
        "Genesis/Mega Drive": [
            "Sega - Mega Drive - Genesis",
            "Sega - Mega Drive - Genesis (Aftermarket)"
         ],
        "Intellivision": [
            "Mattel - Intellivision",
            "Mattel - Intellivision (Aftermarket)",
        ],
        "Interton VC 4000": "Interton - VC 4000",
        "Magnavox Odyssey 2": "Magnavox - Odyssey 2",
        "Master System": [
            "Sega - Master System - Mark III",
            "Sega - Master System - Mark III (Aftermarket)"
        ],
        "Mega Duck": [
            "Welback - Mega Duck",
            "Welback - Mega Duck (Aftermarket)"
        ],
        "MSX": [
            "Microsoft - MSX",
            "Microsoft - MSX (Aftermarket)",
            "Microsoft - MSX2",
            "Microsoft - MSX2 (Aftermarket)"
        ],
        "Neo Geo Pocket": [
            "SNK - NeoGeo Pocket",
            "SNK - NeoGeo Pocket Color"
        ],
        "NES/Famicom": [
            "Nintendo - Nintendo Entertainment System (Headered)",
            "Nintendo - Family Computer Disk System (FDS)",
            "Nintendo - Family Computer Disk System (QD)",
            "Nintendo - Nintendo Entertainment System (Headered) (Aftermarket)"
        ],
        "Nintendo 3DS": [
            "Nintendo - Nintendo 3DS (Decrypted)",
            "Nintendo - New Nintendo 3DS (Decrypted)"
         ],
        "Nintendo 64": [
            "Nintendo - Nintendo 64 (BigEndian)",
            "Nintendo - Nintendo 64 (BigEndian)  (Aftermarket)"
         ],
        "Nintendo DS": [
            "Nintendo - Nintendo DS (Decrypted)",
            "Nintendo - Nintendo DS (Decrypted) (Aftermarket)"
         ],
        "Nintendo DSi": "Nintendo - Nintendo DSi (Digital) (CDN) (Decrypted)",
        "PC-8000/8800": "Non-Redump - NEC - PC-88",
        "PC Engine/TurboGrafx-16": [
            "NEC - PC Engine - TurboGrafx 16",
            "NEC - PC Engine - TurboGrafx 16 (Aftermarket)"
        ],
        "PC Engine CD/TurboGrafx-CD": [
            "Non-Redump - NEC - PC Engine CD + TurboGrafx CD",
            "Non-Redump - NEC - PC Engine CD + TurboGrafx CD (Aftermarket)"
        ],
        "PlayStation": "Non-Redump - Sony - PlayStation",
        "PlayStation 2": "Non-Redump - Sony - PlayStation 2",
        "PlayStation Portable": [
            "Sony - PlayStation Portable (PSN) (Decrypted)",
            "Sony - PlayStation Portable (PSN) (Minis) (Decrypted)",
            "Non-Redump - Sony - PlayStation Portable",
        ],
        "Pokemon Mini": [
            "Nintendo - Pokemon Mini",
            "Nintendo - Pokemon Mini (Aftermarket)"
        ],
        "Satellaview": "Nintendo - Satellaview",
        "Saturn": "Non-Redump - Sega - Sega Saturn",
        "Sega CD": [
            "Non-Redump - Sega - Sega Mega CD + Sega CD",
            "Non-Redump - Sega - Sega Mega CD + Sega CD (Aftermarket)"
        ],
        "SG-1000": [
            "Sega - SG-1000 - SC-3000",
            "Sega - SG-1000 - SC-3000 (Aftermarket)"
        ],
        "SNES/Super Famicom": [
            "Nintendo - Super Nintendo Entertainment System",
            "Nintendo - Super Nintendo Entertainment System (Aftermarket)"
        ],
        "Super Cassette Vision": "Epoch - Super Cassette Vision",
        "Vectrex": "GCE - Vectrex",
        "Virtual Boy": [
            "Nintendo - Virtual Boy",
            "Nintendo - Virtual Boy (Aftermarket)"
        ],
        "Watara Supervision": [
            "Watara - Supervision",
            "Watara - Supervision (Aftermarket)"
        ],
        "Wii": [
            "Nintendo - Wii (Digital) (CDN)",
            "Non-Redump - Nintendo - Wii"
        ],
        "WonderSwan": [
            "Bandai - WonderSwan",
            "Bandai - WonderSwan (Aftermarket)",
            "Bandai - WonderSwan Color",
            "Bandai - WonderSwan Color (Aftermarket)"
        ],
        "Wii U": "Non-Redump - Nintendo - Wii U"
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
        "PC Engine/TurboGrafx-16": [
            "NEC - PC Engine - TurboGrafx 16",
            "NEC - PC Engine - TurboGrafx 16 (Aftermarket)"
        ],
        "PlayStation": "Non-Redump - Sony - PlayStation",
        "PlayStation 2": "Non-Redump - Sony - PlayStation 2",
        "PlayStation Portable": "Non-Redump - Sony - PlayStation Portable",
        "Saturn": "Non-Redump - Sega - Sega Saturn",
        "Sega CD": [
            "Non-Redump - Sega - Sega Mega CD + Sega CD",
            "Non-Redump - Sega - Sega Mega CD + Sega CD (Aftermarket)"
        ],
        "Wii": "Non-Redump - Nintendo - Wii",
        "Wii U": "Non-Redump - Nintendo - Wii U"
    };

    const homebrewConsoleMap = {
        "Uzebox": "",
        "WASM-4": ""
    };

    const lostLevelConsoleMap = {
        "3DO Interactive Multiplayer": "Archive/043 - Lost Level Archive - Panasonic - 3DO Interactive Multiplayer",
        "32X": "Archive/010 - Lost Level Archive - Sega - 32X",
        "Amstrad CPC": [
            "Archive/037 - Lost Level Archive - Amstrad - CPC (CDT)",
            "Archive/037 - Lost Level Archive - Amstrad - CPC (CPR)",
            "Archive/037 - Lost Level Archive - Amstrad - CPC (DSK)",
            "Archive/037 - Lost Level Archive - Amstrad - CPC (SNA)",
            "Extras/037e - Lost Level Archive - Amstrad - CPC (Extras)"
        ],
        "Apple II": "Archive/038 - Lost Level Archive - Apple II",
        "Arcadia 2001": "Archive/073 - Lost Level Archive - Emerson - Arcadia 2001",
        "Arduboy": [
            "Archive/071 - Lost Level Archive - Arduboy Inc. - Arduboy",
            "Archive/071 - Lost Level Archive - Arduboy Inc. - Arduboy FX",
            "Extras/071e - Lost Level Archive - Arduboy Inc. - Arduboy (Extras)"
        ],
        "Atari 2600": [
            "Archive/025 - Lost Level Archive - Atari - 2600",
            "Extras/025e - Lost Level Archive - Atari - 2600 (Extras)"
        ],
        "Atari 7800": "Archive/051 - Lost Level Archive - Atari - 7800",
        "Atari Jaguar": "Archive/017 - Lost Level Archive - Atari - Jaguar",
        "Atari Jaguar CD": "Archive/077 - Lost Level Archive - Atari - Jaguar CD",
        "Atari Lynx": "Archive/013 - Lost Level Archive - Atari - Lynx",
        "ColecoVision": [
            "Archive/044 - Lost Level Archive - Coleco - ColecoVision",
            "Extras/044e - Lost Level Archive - Coleco - ColecoVision (Extras)"
        ],
        "Dreamcast": [
            "Archive/040 - Lost Level Archive - Sega - Dreamcast - BIN-CUE",
            "Archive/040 - Lost Level Archive - Sega - Dreamcast - GDI",
            "Archive/040 - Lost Level Archive - Sega - Dreamcast - NRG",
            "Extras/040e - Lost Level Archive - Sega - Dreamcast (Extras)"
        ],
        "Elektor TV Games Computer": "Archive/075 - Lost Level Archive - Elektor TV Games Computer",
        "Fairchild Channel F": "Archive/057 - Lost Level Archive - Fairchild - Channel F",
        "Game Boy": [
            "Archive/004 - Lost Level Archive - Nintendo - Game Boy",
            "Extras/004e - Lost Level Archive - Nintendo - Game Boy (Extras)"
        ],
        "Game Boy Advance": "Archive/005 - Lost Level Archive - Nintendo - Game Boy Advance",
        "Game Boy Color": "Archive/006 - Lost Level Archive - Nintendo - Game Boy Color",
        "GameCube": [
            "Archive/016 - Lost Level Archive - Nintendo - GameCube",
            "Extras/016e - Lost Level Archive - Nintendo - GameCube (Extras)"
        ],
        "Game Gear": "Archive/015 - Lost Level Archive - Sega - Game Gear",
        "Genesis/Mega Drive": "Archive/001 - Lost Level Archive - Sega - Mega Drive - Genesis",
        "Intellivision": [
            "Archive/045 - Lost Level Archive - Mattel - Intellivision",
            "Extras/045e - Lost Level Archive - Mattel - Intellivision (Extras)"
        ],
        "Interton VC 4000": "Archive/074 - Lost Level Archive - Interton - VC 4000",
        "Magnavox Odyssey 2": "Archive/023 - Lost Level Archive - Magnavox - Odyssey2",
        "Master System": [
            "Archive/011 - Lost Level Archive - Sega - Master System",
            "Extras/011e - Lost Level Archive - Sega - Master System (Extras)"
        ],
        "Mega Duck": "Archive/069 - Lost Level Archive - Wellback - Mega Duck",
        "MSX": [
            "Archive/029 - Lost Level Archive - Microsoft - MSX - CAS",
            "Archive/029 - Lost Level Archive - Microsoft - MSX - DSK",
            "Archive/029 - Lost Level Archive - Microsoft - MSX - ROM",
            "Archive/029 - Lost Level Archive - Microsoft - MSX - TAP",
            "Extras/029e - Lost Level Archive - Microsoft - MSX (Extras)"
        ],
        "Neo Geo CD": "Archive/056 - Lost Level Archive - SNK - Neo Geo CD",
        "Neo Geo Pocket": "Archive/014 - Lost Level Archive - SNK - Neo Geo Pocket Color",
        "NES/Famicom": [
            "Archive/007 - Lost Level Archive - Nintendo - Famicom - NES",
            "Archive/007 - Lost Level Archive - Nintendo - Famicom - NES (UNF)",
            "Extras/007e - Lost Level Archive - Nintendo - Famicom - NES (Extras)"
        ],
        "Nintendo 64": "Archive/002 - Lost Level Archive - Nintendo - Nintendo 64",
        "Nintendo DS": "Archive/018 - Lost Level Archive - Nintendo - Nintendo DS",
        "PC-8000/8800": [
            "Archive/047 - Lost Level Archive - NEC - PC-8001",
            "Archive/047 - Lost Level Archive - NEC - PC-8801 - D88",
            "Archive/047 - Lost Level Archive - NEC - PC-8801 - T88",
            "Extras/047e - Lost Level Archive - NEC - PC-8801 (Extras)"
        ],
        "PC-FX": "Archive/049 - Lost Level Archive - NEC - PC-FX",
        "PC Engine CD/TurboGrafx-CD": "Archive/076 - Lost Level Archive - NEC - PC Engine CD - TurboGrafx-CD",
        "PC Engine/TurboGrafx-16": "Archive/008 - Lost Level Archive - NEC - PC Engine - TurboGrafx-16",
        "PlayStation": [
            "Archive/012 - Lost Level Archive - Sony - PlayStation",
            "Extras/012e - Lost Level Archive - Sony - PlayStation (Extras)"
        ],
        "PlayStation 2": "Archive/021 - Lost Level Archive - Sony - PlayStation 2",
        "PlayStation Portable": [
            "Archive/041 - Lost Level Archive - Sony - PlayStation Portable (EBOOT)",
            "Archive/041 - Lost Level Archive - Sony - PlayStation Portable (ISO)",
            "Archive/041 - Lost Level Archive - Sony - PlayStation Portable (TBD)"
        ],
        "Pokemon Mini": "Archive/024 - Lost Level Archive - Nintendo - Pokemon Mini",
        "Saturn": "Archive/039 - Lost Level Archive - Sega - Saturn",
        "Sega CD": "Archive/009 - Lost Level Archive - Sega - Sega CD",
        "SG-1000 SG-1000": "Archive/033 - Lost Level Archive - Sega - SG-1000",
        "SNES/Super Famicom": [
            "Archive/003 - Lost Level Archive - Nintendo - Super Famicom - SNES",
            "Archive/003 - Lost Level Archive - Nintendo - Super Famicom - SNES - MSU-1"
        ],
        "Uzebox": "Archive/080 - Lost Level Archive - Uzebox",
        "Vectrex": [
            "Archive/046 - Lost Level Archive - GCE - Vectrex",
            "Extras/046e - Lost Level Archive - GCE - Vectrex (Extras)"
        ],
        "Virtual Boy": "Archive/028 - Lost Level Archive - Nintendo - Virtual Boy",
        "WASM-4": "Archive/072 - Lost Level Archive - WASM-4",
        "Watara Supervision": "Archive/063 - Lost Level Archive - Watara - Supervision",
        "WonderSwan": [
            "Archive/053 - Lost Level Archive - Bandai - WonderSwan",
            "Archive/053 - Lost Level Archive - Bandai - WonderSwan Color"
        ]
    };

    const consoleMapLookup = {
        "4amcrack": {},
        "cleancpc": cleancpcConsoleMap,
        "fbneo": fbneoConsoleMap,
        "goodtools": miscConsoleMap,
        "lostlevel": lostLevelConsoleMap,
        "mamesl": {},
        "neokobe": neokobeConsoleMap,
        "No-Intro": noIntroConsoleMap,
        "Non-Redump": nonRedumpConsoleMap,
        "nongood": {},
        "rapatches": {},
        "Redump": redumpConsoleMap,
        "tosec": tosecConsoleMap,
        "wozaday": wozadayConsoleMap
    };
    
    const raConsoleMap = {
      "3DO Interactive Multiplayer": "3DO Interactive Multiplayer",
      "32X": "Sega 32X",
      "Amstrad CPC": "Amstrad CPC",
      "Apple II": "Apple II",
      "Arcade": "Arcade",
      "Arcadia 2001": "Emerson Arcadia 2001",
      "Arduboy": "Arduboy",
      "Atari 2600": "Atari 2600",
      "Atari 7800": "Atari 7800",
      "Atari Jaguar": "Atari Jaguar",
      "Atari Jaguar CD": "Atari Jaguar CD",
      "Atari Lynx": "Atari Lynx",
      "ColecoVision": "Colecovision",
      "Dreamcast": "Sega Dreamcast",
      "Elektor TV Games Computer": "Elektor TV Games Computer",
      "Fairchild Channel F": "Fairchild Channel F",
      "Game Boy": "Nintendo Game Boy",
      "Game Boy Advance": "Nintendo Game Boy Advance",
      "Game Boy Color": "Nintendo Game Boy Color",
      "GameCube": "Nintendo GameCube",
      "Game Gear": "Sega Game Gear",
      "Genesis/Mega Drive": "Sega Genesis",
      "Intellivision": "Mattel Intellivision",
      "Interton VC 4000": "Interton VC 4000",
      "Magnavox Odyssey 2": "Magnavox Odyssey 2",
      "Master System": "Sega Master System",
      "Mega Duck": "Mega Duck",
      "MSX": "Microsoft MSX",
      "Neo Geo CD": "SNK Neo Geo CD",
      "Neo Geo Pocket": "SNK Neo Geo Pocket",
      "NES/Famicom": "Nintendo Entertainment System",
      "Nintendo 64": "Nintendo 64",
      "Nintendo DS": "Nintendo DS",
      "Nintendo DSi": "Nintendo DSi",
      "PC-8000/8800": "NEC PC-8801",
      "PC-FX": "NEC PC-FX",
      "PC Engine CD/TurboGrafx-CD": "NEC TurboGrafx-CD",
      "PC Engine/TurboGrafx-16": "NEC TurboGrafx-16",
      "PlayStation": "Sony Playstation",
      "PlayStation 2": "Sony Playstation 2",
      "PlayStation Portable": "Sony PSP",
      "Pokemon Mini": "Nintendo Pokemon Mini",
      "Saturn": "Sega Saturn",
      "Sega CD": "Sega CD",
      "SG-1000": "Sega SG-1000",
      "SNES/Super Famicom": "Super Nintendo Entertainment System",
      "Uzebox": "Uzebox",
      "Vectrex": "GCE Vectrex",
      "Virtual Boy": "Nintendo Virtual Boy",
      "WASM-4": "WASM-4",
      "Watara Supervision": "Watara Supervision",
      "WonderSwan": "WonderSwan"
    };

    const consoleFileCandidates = {
      "3DO Interactive Multiplayer": [".chd"],
      "Atari Jaguar CD": [".cdi",".bin",".cue"],
      "Dreamcast": [".chd",".m3u"],
      "GameCube": [".rvz"],
      "Neo Geo CD": [".chd"],
      "PC-FX": [".chd"],
      "PC Engine CD/TurboGrafx-CD": [".chd"],
      "PlayStation": [".chd",".m3u"],
      "PlayStation 2": [".chd"],
      "PlayStation Portable": [".chd"],
      "Saturn": [".chd"],
      "Sega CD": [".chd"]
    };

    const defaultFileCandidates = [".zip"];

    consoleMap = consoleMapLookup[dumpGroup] || null;

    const consoleEntry = consoleMap?.[consoleName] || consoleName;
    const formattedConsoleNames = Array.isArray(consoleEntry) ? consoleEntry : [consoleEntry];

    const romExtensions = [".001", ".2mg", ".7z", ".32x", ".a2r", ".a26", ".a78", ".adf", ".adz", ".aif", ".ami", ".apk", ".arduboy", ".atr", ".b64", ".bjl", ".bin", ".bit", ".bs", ".bz2", ".cas", ".cbz", ".ccd", ".cdi", ".cdt", ".cfg", ".cg", ".chd", ".cia", ".cmt", ".col", ".com", ".cpr", ".cpr", ".crt", ".cue", ".d13", ".d64", ".d88", ".dfi", ".dl", ".do", ".dol", ".dsk", ".dsv", ".duck", ".e", ".e7", ".ecm", ".edd", ".eep", ".elf", ".fdi", ".fds", ".flux", ".g>", ".gb", ".gba", ".gbc", ".gbx", ".gcm", ".gcz", ".gen", ".gg", ".glsl", ".hdf", ".hdm", ".hdv", ".hex", ".hfe", ".hlsl", ".hxcstream", ".img", ".ims", ".ini", ".int", ".ipf", ".iso", ".jag", ".j64", ".jpe", ".lha", ".lnx", ".lyx", ".m4a", ".mcr", ".md", ".mdf", ".mds", ".mfi", ".mo5", ".mp3", ".mpk", ".ms", ".n64", ".ndd", ".nds", ".nes", ".ngc", ".ngp", ".nib", ".nrg", ".nsp", ".o", ".one", ".part1", ".pbp", ".pc2", ".pce", ".pdf", ".pkg", ".po", ".po", ".prg", ".ps2", ".qcow2", ".rar", ".raw", ".rom", ".rvz", ".sap", ".sav", ".scp", ".sfc", ".sg", ".sgx", ".shk", ".smc", ".smd", ".sms", ".sna", ".srm", ".st", ".st0", ".sta", ".sv", ".t64", ".t88", ".tap", ".tgx", ".tvc", ".tzx", ".uze", ".v64", ".vb", ".vdi", ".vec", ".vpk", ".wad", ".warc", ".wasm", ".wav", ".wbfs", ".wiu", ".woz", ".woz", ".ws", ".wsc", ".wua", ".wv", ".xdf", ".xex", ".xlm", ".z64", ".z80", ".zcci", ".zip"];

    const sortedExtensions = romExtensions.sort((a, b) => b.length - a.length);

    function cleanRomFileName(fileNameToClean) {
      let cleaned = fileNameToClean.replace(/^\//, "");
      for (const ext of sortedExtensions) {
        if (cleaned.toLowerCase().endsWith(ext.toLowerCase())) {
          cleaned = cleaned.slice(0, -ext.length);
          break;
        }
      }
      return cleaned;
    }
    let cleanedFileName = cleanRomFileName(fileName);
    let hasAngular = /<[^>]*>/.test(fileName);

    let removedAngular, cleanedAngular;
    if (hasAngular) {
        removedAngular = fileName.replace(/\s*<[^>]*>/g, "").trim();
        cleanedAngular = cleanRomFileName(removedAngular);
    }

    let fileCandidates = [];

    const raConsoleName = raConsoleMap[consoleName];
    if (raConsoleName) {
        const extensions = consoleFileCandidates[consoleName] || defaultFileCandidates;
        if (hasAngular) {
            fileCandidates.push(
                ...extensions.map(ext => cleanedAngular + ext),
                ...extensions.map(ext => removedAngular + ext),
                cleanedAngular,
                removedAngular,
            );
        } else {
            fileCandidates.push(...extensions.map(ext => cleanedFileName + ext), ...extensions.map(ext => fileName + ext), fileName);
        }
        fileCandidates = [...new Set(fileCandidates)];
        const raBaseUrl = `https://myrient.erista.me/files/RetroAchievements/RA - ${(raConsoleName)}/`;
        for (const candidate of fileCandidates) {
            const url = raBaseUrl + candidate;
            try {
                const response = await axios.head(url, { timeout: 10000 });
                if (response.status === 200) return url;
            } catch {}
        }
    }

    fileCandidates = [];
    if (hasAngular) {
        fileCandidates.push(cleanedAngular + ".zip", removedAngular + ".zip", cleanedAngular, removedAngular, fileName);
    } else {
        fileCandidates.push(cleanedFileName + ".zip", fileName + ".zip", fileName);
    }
    fileCandidates = [...new Set(fileCandidates)];
    let basePath;
    switch (dumpGroup) {
      case "fbneo":
        basePath = "FinalBurn Neo";
        break;
      case "lostlevel":
        basePath = "Lost Level";
        break;
      case "Redump":
        basePath = "Redump";
        break;
      case "No-Intro":
      case "Non-Redump":
        basePath = "No-Intro";
        break;
      case "tosec":
        basePath = "TOSEC";
        break;
      default:
        basePath = dumpGroup;
    }

    for (const folder of formattedConsoleNames) {
      const cleanFolder = folder.replace(/^\/+|\/+$/g, "");
      const baseUrl =
        dumpGroup === "tosec"
          ? cleanFolder
            ? `https://myrient.erista.me/files/${cleanFolder}/`
            : `https://myrient.erista.me/files/`
          : cleanFolder
          ? `https://myrient.erista.me/files/${basePath}/${cleanFolder}/`
          : `https://myrient.erista.me/files/${basePath}/`;
      for (const candidate of fileCandidates) {
        const url = baseUrl + candidate;
        try {
          const response = await axios.head(url, { timeout: 10000 });
          if (response.status === 200) {
            return url;
          }
        } catch {}
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
    if (![31888, 11618, 11622, 11620, 11623, 11624, 11619, 11625, 11621, 13106].includes(id)) { // EXCLUDE CHEAT ROMS
      console.error(`Processing ID: ${id}`);
      await fetchSaveGameHashes(id);
    }
  }

  console.error("--- Hash Generation Complete ---");
  return { allGameHashes, nonMatchingHashes };
}

function mergeHashes(allGameHashes) {
  console.error("--- Running Hash Merge ---");
  const hashlinksPath = path.join(__dirname, "../hashlinks.json");
  const hashlinks2 = JSON.parse(fs.readFileSync(hashlinksPath, "utf-8"));

  Object.keys(allGameHashes).forEach((id) => {
    if (!hashlinks2[id]) hashlinks2[id] = [{}];
    const gameHashes = allGameHashes[id];

    const processEntry = (url, id, hash) => {
      const alreadyExists =
        hashlinks2[id] &&
        Array.isArray(hashlinks2[id]) &&
        hashlinks2[id].some(
          (obj) => obj && typeof obj === "object" && obj.hasOwnProperty(hash)
        );

      if (!alreadyExists) {
        hashlinks2[id][0][hash] = url;
      }
    };

    if (Array.isArray(gameHashes)) {
      gameHashes.forEach((hashInfo) => {
        Object.keys(hashInfo).forEach((hash) => processEntry(hashInfo[hash], id, hash));
      });
    } else if (typeof gameHashes === "object") {
      Object.keys(gameHashes).forEach((hash) => processEntry(gameHashes[hash], id, hash));
    }
  });

  fs.writeFileSync(hashlinksPath, JSON.stringify(hashlinks2, null, 2));
  console.error("Merged data saved to hashlinks.json");
  console.error("--- Hash Merge Complete ---");
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

  const hashlinksPath = path.join(__dirname, "../hashlinks.json");
  const existingHashlinks = JSON.parse(fs.readFileSync(hashlinksPath, "utf-8"));

  let newCount = 0;
  let alreadyExistedCount = 0;

  Object.entries(allGameHashes).forEach(([gameId, gameHashesArray]) => {
    gameHashesArray.forEach((hashInfo) => {
      Object.entries(hashInfo).forEach(([md5, url]) => {
        const alreadyExists =
          existingHashlinks[gameId] &&
          Array.isArray(existingHashlinks[gameId]) &&
          existingHashlinks[gameId].some(
            (obj) => obj && typeof obj === "object" && obj.hasOwnProperty(md5)
          );

        if (alreadyExists) {
          alreadyExistedCount++;
        } else {
          newCount++;
        }
      });
    });
  });

  const totalSuccessful = newCount + alreadyExistedCount;

  mergeHashes(allGameHashes);
  mergeFailedHashes(nonMatchingHashes);
  removeFoundHashes();
  updateReadmeCount();

  if (totalSuccessful > 0) {
    console.log("Update hashes");
    console.log("");
    if (newCount > 0) {
      console.log(`New hashes added: ${newCount}`);
    }
    if (alreadyExistedCount > 0) {
      console.log(`Hashes already existed: ${alreadyExistedCount}`);
    }
    console.log(`Total successful this run: ${totalSuccessful}`);
  }
}

main().catch((err) => {
  console.error("An error occurred during the hash pipeline execution:", err);
});