# RetroAchievements.org Download Supported Game Files TamperMonkey Script

This script adds download links for supported game files on RetroAchievements.org's "Supported Game Files" pages. It utilizes hash information to inject direct download links for supported ROM files. Please ensure you respect RetroAchievements' policies and the legal framework in your region when using this tool.

![Screenshot](https://i.imgur.com/O9ad6mm.png)

## Linked Hash Status (as of Apr. 1, 2025)
- **Linked Hashes:** 13,426
- **Missing Hashes:** 1,650

## Searchable Web Application (Search by either Game ID or Hash)
### [CLICK HERE FOR WEB APP VERSION](https://mentalblank.github.io/RARomOnHashes)

## Disclaimer

- **Respect RA.org's Policies:** Please refrain from posting links to ROMs on RetroAchievements' website or Discord.
- **ROM Legality:** Ensure you have the legal rights to any files accessed through this script. Downloading ROMs without owning the original physical copy may violate copyright laws in your region.
- **Game Preservation:** The script supports video game preservation efforts by enabling easier access to classic games. However, always respect the rights of game developers and publishers when using such tools.
- By using this script, you agree to comply with all applicable laws in your jurisdiction. Be cautious and mindful of legal boundaries when sharing or downloading digital content.
- No actual files are hosted here and these tools will simply link you to them, Think of it like google but for roms.

## Important Notes

- The updated and fixed scripts may have a small delay in generating download links. If no download link appears after a few moments, try refreshing the page or sourcing it manually, as the file might not exist in `hashlinks.json` or on Archive.org.
- RetroAchievements occasionally "recycles" game IDs, which can lead to incorrect links. These game IDs may no longer match the linked ROMs. If this happens, please report it via bug report or modify the hashlist via a pull request.
- The updated script will pull updates from this repo only when it has been 24 hours since the last time it pulled an update.
- Most of the missing hashes (1063) are currently missing due to an issue with wholee's SNES archive.org dump, I am working on replacing these. The rest of them are mainly rom hacks and I plan on including these too.
- TBH I have no idea if the userscripts will work with Chromium based browsers (eg. Chrome, Edge, Opera, etc.) after the whole Manifest V3 thing, although i've seen that it is now necessary to [enable developer mode to run userscripts via Tampermonkey](https://www.tampermonkey.net/faq#Q209). From what i understand, Google is also force disabling / blocking installs of TamperMonkey. I use Firefox with ViolentMonkey and have no intention of switching or troubleshooting any Chromium related issues.

## Script Versions

There are three versions of the script available. Choose only one version to use at a time:

- **[Updated Script](https://github.com/MentalBlank/RARomOnHashesUserScript/raw/refs/heads/main/TamperMonkeyRetroachievements.js)** – The most current version with a GitHub-hosted hashlist that can be edited through pull requests, also has more linked roms!
- **[Fixed Old Script](https://github.com/MentalBlank/RARomOnHashesUserScript/raw/refs/heads/main/OriginalTamperMonkeyRetroachievementsFixed.js)** – The original script by Wholee, hosted on Archive.org, with modifications for compatibility with RetroAchievements’ new layout.
- **[Original Wholee Script](https://archive.org/details/retroachievements_collection_v5)** – The initial, unmodified version of the script, hosted on Archive.org, which may not be functional.

## Userscript Installation

Follow these steps to install the script using TamperMonkey (or ViolentMonkey):

### 1. Install TamperMonkey

- **FAQ:** [TamperMonkey FAQ](https://www.tampermonkey.net/faq.php#Q102)
- **For Chrome:** [TamperMonkey Chrome Extension](https://tampermonkey.net/?ext=dhdg&browser=chrome)
- **For Firefox:** [Tampermonkey Firefox Add-on](https://tampermonkey.net/?ext=dhdg&browser=firefox)
- **For Safari:** [Tampermonkey Safari Extension](https://tampermonkey.net/?ext=dhdg&browser=safari)

### 2. Add the Script to TamperMonkey

- Open the **TamperMonkey dashboard** by clicking the TamperMonkey icon and selecting **Dashboard**.
- Click on the **"Add a new script"** button (or the "+" icon).
- In the editor, delete any default code and paste in one of the following scripts:
  - **[Updated Script](https://github.com/MentalBlank/RARomOnHashesUserScript/raw/refs/heads/main/TamperMonkeyRetroachievements.js)**
  - **[Fixed Old Script](https://github.com/MentalBlank/RARomOnHashesUserScript/raw/refs/heads/main/OriginalTamperMonkeyRetroachievementsFixed.js)**
  - **[Original Wholee Script](https://archive.org/details/retroachievements_collection_v5)**

### 3. Save and Activate

- Save the script by selecting **File > Save** or pressing **Ctrl + S** (Windows) / **Cmd + S** (Mac).
- Refresh the RetroAchievements.org "Supported Game Files" page to activate the script.

## Pull Requests

When submitting pull requests to update the `hashlinks.json` file, please ensure the json is valid, the matching hashes are removed from `missinghashes.json`, and you list in the commit description the games added / modified.

## Thanks, Acknowledgements, & Credits

- Wholee for their RA Dump and original script.
- Pipetboy for the idea of a web application.
- The Erista Group & Myrient teams.
- The RetroAchievements team.
- Anyone who finds these scripts useful <3