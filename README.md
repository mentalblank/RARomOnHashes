# RetroAchievements.org Supported Game Files TamperMonkey Script

This script adds download links for supported game files on RetroAchievements.org's "Supported Game Files" pages. It uses hash information to inject direct download links for supported ROM files. Please ensure you comply with RetroAchievements' policies and the legal framework in your region when using this tool.

![Screenshot](https://i.imgur.com/O9ad6mm.png)

## 🔗 Linked Hash Status (as of Oct. 19, 2025)
- **Linked Hashes:** 14,154
- **Missing Hashes:** 2,183

## 🌐 Searchable Web Application

[Click here for the web app version](https://mentalblank.github.io/RARomOnHashes)
> **Note:** Search by either the Game ID or a linked hash.

## ⚖️ Disclaimer

- **Respect RA’s Policies**: Do not post ROM links on RetroAchievements' website or Discord.
- **ROM Legality**: Ensure you have legal rights to access any ROMs through this script. Downloading ROMs without owning the physical copy may violate copyright laws in your jurisdiction.
- **Game Preservation**: This tool supports video game preservation efforts by enabling easier access to classic games. However, you should always respect the game developers' and publishers' rights.
- By using this script, you agree to comply with all relevant laws. Always be mindful of legal boundaries when sharing or downloading digital content.
- **No File Hosting**: This tool does not host ROMs but links to them, similar to a search engine.

## ⚠️ Important Notes

- **Download Link Delays**: New or updated scripts may have a slight delay in generating links. If a link does not appear, refresh the page or source it manually from Archive.org or `hashlinks.json`.
- **Game ID Changes**: RetroAchievements occasionally "recycles" game IDs, leading to mismatched links. Please report any issues or submit a pull request to update `hashlinks.json`.
- **Update Cycle**: The script will pull updates from this repository only if a change has been made and check only once every 24 hours.
- **Missing Hashes**: A significant amount of the missing hashes are due to issues with Wholee’s SNES archive dump on Archive.org, which will slowly be re-linked as the files are located elsewhere. The rest are mostly rom hacks.
- **Manifest V3**: Userscripts may face compatibility issues with Chromium browsers (e.g., Chrome, Edge, Opera) after the shift to Manifest V3. You may need to [enable developer mode](https://www.tampermonkey.net/faq#Q209) to run userscripts. I use Firefox and do not troubleshoot Chromium-specific issues at this time.
- **Archive.org**: As this project relies on a small number of Archive.org dumps, it is advised to remain signed into Archive.org so you can access these files.

## 📜 Script Versions

There are three versions of the script available. Choose one to use at a time:

- **[Updated Script](https://github.com/MentalBlank/RARomOnHashesUserScript/raw/refs/heads/main/TamperMonkeyRetroachievements.js)**: The most current version with a GitHub-hosted hash list that can be edited via pull requests.
- **[Fixed Original Script](https://github.com/MentalBlank/RARomOnHashesUserScript/raw/refs/heads/main/OriginalTamperMonkeyRetroachievementsFixed.js)**: The original script by Wholee, with modifications for RetroAchievements’ new layout.
- **[Original Wholee Script](https://archive.org/details/retroachievements_collection_v5)**: The initial, unmodified script (Non-Functional).
> **Note:** My updated version is linked to more ROMs than the original or fixed versions of Wholee's script. This may change if Wholee comes back to update and fix their Archive.org upload, but my script can be edited far more often and more easily by multiple people.

## 📥 Installation Instructions

### 1. Install TamperMonkey

- **[TamperMonkey FAQ](https://www.tampermonkey.net/faq.php#Q102)**
- **[Chrome Extension](https://tampermonkey.net/?ext=dhdg&browser=chrome)**
- **[Firefox Add-On](https://tampermonkey.net/?ext=dhdg&browser=firefox)**
- **[Safari Extension](https://tampermonkey.net/?ext=dhdg&browser=safari)**
> **Note:** Alternatively, you can also use ***ViolentMonkey*** or ***FireMonkey***

### 2. Add the Script to TamperMonkey

- Open the **TamperMonkey dashboard** by clicking the TamperMonkey icon and selecting **Dashboard**.
- Click on **"Add a new script"** (or the "+" icon).
- Paste the contents of one of the above script versions into the editor.

### 3. Save and Activate

- Save the script by selecting **File > Save** or pressing **Ctrl + S** (Windows) / **Cmd + S** (Mac).
- Refresh any RetroAchievements.org "Supported Game Files" page to activate the script.
> **Notes:**
> - If no links appear ([Screenshot](https://i.imgur.com/O9ad6mm.png)) after a few seconds or a page refresh, you can check to see if the script is running in your browser's dev console which will say "***RA Hash List Script is running!***"
> - You can also check [hashlinks.json](https://raw.githubusercontent.com/mentalblank/RARomOnHashes/refs/heads/main/hashlinks.json) to see if the hashes have been linked.

## 🔄 Pull Requests

Pull requests from the community are welcome here.

To contribute updates to `hashlinks.json`, please ensure the following:

- The JSON is valid.
- Matching hashes are removed from `missinghashes.json`.
- List the added or modified games in the commit description.

## 🙏 Thanks, Acknowledgements, & Credits

- **Wholee**: For the RA Dump and the original script.
- **Pipetboy**: For the web application idea.
- **Erista Group & Myrient teams**: For their preservation efforts.
- **RetroAchievements Team**: For their platform and contributions to emulation and nostalgia.
- **All Users**: Thank you for using these scripts!
