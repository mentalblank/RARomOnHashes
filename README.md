### TamperMonkey script to add download links to RetroAchievements.org's "Supported Game Files" pages

### Disclaimer:
- **Please respect RA.org's policies and do not post links to ROMs on their website or Discord.**
- **ROMs and Legality:** Users are encouraged to ensure they have the legal rights to any files they access through this script. Downloading ROMs without owning the original physical copy may violate copyright laws in your region. Always verify the legality of ROMs and other digital content before use.
- **Video Game Preservation:** This script is part of a broader effort to support video game preservation. The archiving of games is important to ensure that classic video games remain accessible and playable for future generations. However, it is important to always respect the rights of developers and publishers while engaging in such activities.
- By using this script, you agree to comply with all applicable laws and regulations in your jurisdiction. Please exercise caution and respect the legal boundaries of game preservation and digital content sharing.

### Versions:

There are 3 versions of the script to download (Only use one at a time):
- **Updated Script** - The hashlist is hosted on GitHub and can be quickly edited through pull requests.
- **Fixed Old Script** - Wholee's original script and hashlist hosted on Archive.org with changes by me to ensure it's compatible with the new RA web layout.
- **Original Wholee Script** - A broken script and hashlist hosted on Archive.org.

### Note:
The updated and fixed scripts have a small delay, but if no download link appears after a few moments, you may need to source it manually as the file most likely does not exist in hashlinks.json / the archive.org source.

### Install:

- **Updated Script:** [TamperMonkeyRetroachievements.js](https://github.com/MentalBlank/RARomOnHashesUserScript/raw/refs/heads/main/TamperMonkeyRetroachievements.js)
- **Fixed Old Script:** [OriginalTamperMonkeyRetroachievementsFixed.js](https://github.com/MentalBlank/RARomOnHashesUserScript/raw/refs/heads/main/OriginalTamperMonkeyRetroachievementsFixed.js)
- **Original Wholee Script:** [External Link to Archive.org collection](https://archive.org/details/retroachievements_collection_v5)

### Installation Instructions for Tampermonkey:

1. **Install Tampermonkey** (if you don't already have it) (or ViolentMonkey):
   - **For Chrome:** [Tampermonkey Chrome Extension](https://tampermonkey.net/?ext=dhdg&browser=chrome)
   - **For Firefox:** [Tampermonkey Firefox Add-on](https://tampermonkey.net/?ext=dhdg&browser=firefox)
   - **For Safari:** [Tampermonkey Safari Extension](https://tampermonkey.net/?ext=dhdg&browser=safari)

2. After installing Tampermonkey, open the **Tampermonkey dashboard** by clicking the Tampermonkey icon in your browser and selecting **Dashboard**.

3. Click on the **"Add a new script"** button (or the "+" icon).

4. In the **script editor** that opens, delete any default code and paste the script you wish to install (e.g., **Updated Script** or **Fixed Old Script**).

5. Save the script by clicking **File > Save** or by pressing **Ctrl + S** (Windows) / **Cmd + S** (Mac).

6. **Refresh** the RetroAchievements.org "Supported Game Files" page to activate the script.

### Screenshot:

![Screenshot](https://i.imgur.com/O9ad6mm.png)

### Pull Requests:
If submitting pull requests that edit hashlinks.json. please list the games you are adding in the commit description and its system (eg. Genesis: Beyond Oasis) and ensure your addition is formatted correctly.
