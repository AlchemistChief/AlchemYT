const fs = require('fs');
const path = require('path');

function clearDownloadsFolder() {
    const downloadsPath = path.resolve(__dirname, 'downloads');

    fs.readdir(downloadsPath, (err, files) => {
        if (err) {
            console.error(`Error reading downloads folder: ${err.message}`);
            return;
        }

        files.forEach((file) => {
            const filePath = path.join(downloadsPath, file);
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error(`Error deleting file ${file}: ${err.message}`);
                } else {
                    console.log(`Deleted file: ${file}`);
                }
            });
        });
    });
}

module.exports = clearDownloadsFolder;
