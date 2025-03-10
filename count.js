const fs = require('fs');

function countIdsAndMd5(filePath) {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading the file ${filePath}:`, err);
      return;
    }
    const jsonData = JSON.parse(data);

    const countIds = Object.keys(jsonData).length;
    //console.log(`Number of IDs in ${filePath}: ${countIds}`);

    let md5Count = 0;
    Object.values(jsonData).forEach(value => {
      if (Array.isArray(value)) {
        value.forEach(entry => {
          md5Count += Object.keys(entry).length;
        });
      } else if (typeof value === 'object' && value !== null) {
        md5Count += Object.keys(value).length;
      } else {
        console.error(`Expected an array or object but got ${typeof value}`);
      }
    });
    console.log(`Number of MD5 entries in ${filePath}: ${md5Count}`);
  });
}

countIdsAndMd5('missinghashes.json');
countIdsAndMd5('hashlinks.json');