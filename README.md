# RetroAchievements.org Supported Game Files TamperMonkey Script

### NOTE: Due to Myrient closing down on 31 MARCH 2026, I will be abandoning and archiving this project. If a similar preservation project is launched then I may revisit this project. Thanks gamers.

This userscript automatically adds download links for supported ROMs on RetroAchievements.org "Supported Game Files" pages. It uses hash information to inject direct download links for supported ROM files.

> **Note:** Please ensure you comply with RetroAchievements’ policies and the legal framework in your region when using this tool.

![Screenshot](https://i.imgur.com/XvBpKxx.png)

---

## 🔗 Linked Hash Status (as of Mar. 2, 2026)
- **Linked Hashes:** 35,922
- **Missing Hashes:** 5,270

---

## ⚖️ Disclaimer
- **Respect RA Policies:** Do not post ROM links on RetroAchievements’ website or Discord.
- **ROM Legality:** Only access ROMs you legally own. Downloading ROMs without owning a physical copy may violate copyright laws.
- **Game Preservation:** This tool supports video game preservation, but always respect developers’ and publishers’ rights.
- **No File Hosting:** The script does not host ROMs; it only links to them, similar to a search engine.
- By using this script, you agree to comply with all relevant laws.

---

## ⚠️ Technical Notes
- **Myrient Links:** Due to Myrient changes, download requests open the website and search for the filename before downloading.
- **Archive.org Links:** Some files rely on Archive.org. Stay signed in to access them.
- **Rezi Search Links:** For games with unmatched hashes, the script provides a Rezi search link so you can quickly attempt to manually locate the correct ROM.
- **Game ID Changes:** RetroAchievements occasionally recycles game IDs. Report any issues here or submit a pull request to update [`hashlinks.json`](https://raw.githubusercontent.com/mentalblank/RARomOnHashes/refs/heads/main/hashlinks.json).
- **Update Cycle:** The script checks for updates once every 24 hours if the repository has changed.
- **Manifest V3:** Chromium browsers (Chrome, Edge, Opera) may face userscript compatibility issues. You may need [developer mode enabled](https://www.tampermonkey.net/faq#Q209). Firefox is recommended for best results.

---

## 📥 Installation Instructions

### 1. Install TamperMonkey (or Alternatives)
TamperMonkey lets you run custom scripts in your browser.

- [TamperMonkey FAQ](https://www.tampermonkey.net/faq.php#Q102)
- [Chrome Extension](https://tampermonkey.net/?ext=dhdg&browser=chrome)
- [Firefox Add-On](https://tampermonkey.net/?ext=dhdg&browser=firefox)
- [Safari Extension](https://tampermonkey.net/?ext=dhdg&browser=safari)

> **Alternative:** ViolentMonkey or FireMonkey can also be used.

---

### 2. Install the Script

#### Option A – Install from URL (Recommended)
1. Open TamperMonkey → Dashboard → Utilities → **Install from URL**.
2. Paste this URL:
   **https://github.com/MentalBlank/RARomOnHashesUserScript/raw/refs/heads/main/TamperMonkeyRetroachievements.js**
3. Click **Install**.

> ✅ Ensures automatic updates whenever the script changes.

#### Option B – Install Manually
1. Open TamperMonkey → Dashboard → **Add a new script** (or click **+**).
2. Copy the entire [script](https://github.com/MentalBlank/RARomOnHashesUserScript/raw/refs/heads/main/TamperMonkeyRetroachievements.js) into the editor.
3. Save (**File > Save** or **Ctrl + S / Cmd + S**).

---

### 3. Activate the Script
- Refresh any [RetroAchievements.org “Supported Game Files” page](https://retroachievements.org/).
- Wait for the page to load and links to appear.
> **Note:** See the following "Troubleshooting" section if links don’t appear.

---

### 4. Troubleshooting
- Ensure the script is **enabled** in TamperMonkey.
- Make sure the page fully loads before the script runs.
- Open the browser’s developer console to verify the script is running: "***RA Rom Download Script running.***"
- Confirm linked hashes at [`hashlinks.json`](https://raw.githubusercontent.com/mentalblank/RARomOnHashes/refs/heads/main/hashlinks.json).

---

## 🔄 Contributing & Pull Requests
Pull requests from the community are welcome. When updating `hashlinks.json`:

- Ensure the JSON is **valid**.
- Remove matching hashes from `missinghashes.json` if applicable.

---

## 🙏 Acknowledgements & Credits
- **Wholee:** RA dump and original script this project was based on.
- **Erista Group & Myrient Teams:** Preservation efforts.
- **RetroAchievements Team:** Platform and emulation support.
- **All Users:** Thank you for using and testing this script!
