const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        const isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

let modifiedFiles = 0;

walkDir('./src', (filePath) => {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Find https://images.unsplash.com URLs and add &auto=format&fit=crop if not present
        const originalContent = content;
        
        // Regex to match unsplash URLs that end with quotes
        content = content.replace(/(https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9-]+\?w=\d+&q=\d+)(["'])/g, (match, url, quote) => {
            if (!url.includes('auto=format')) {
                return `${url}&auto=format&fit=crop${quote}`;
            }
            return match;
        });

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated ${filePath}`);
            modifiedFiles++;
        }
    }
});

console.log(`Finished processing. Modified ${modifiedFiles} files.`);
