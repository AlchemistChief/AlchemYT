const fs = require('fs');
const path = require('path');

function clearFolder(folderPath) {
    fs.readdir(folderPath, (err, files) => {
        if (err) {
            console.error(`Error reading folder ${folderPath}: ${err.message}`);
            return;
        }

        files.forEach((file) => {
            const filePath = path.join(folderPath, file);
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

function clearDownloadsFolder() {
    const downloadsPath = path.resolve(__dirname, 'downloads');
    const dltemPPath = path.resolve(__dirname, 'dltemP');

    clearFolder(downloadsPath);
    clearFolder(dltemPPath);
}

module.exports = clearDownloadsFolder;