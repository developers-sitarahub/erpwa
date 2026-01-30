const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'officialTemplates.ts');
let content = fs.readFileSync(filePath, 'utf8');

const regex = /body:\s*"([^"]+)"/g;

content = content.replace(regex, (match, bodyContent) => {
    let fixedBody = bodyContent.trim();

    // 1. Fix variables at the very beginning
    // We check for {{ at the start, ignoring leading whitespace which trim already did
    if (fixedBody.startsWith('{{')) {
        // Prepend a natural greeting or identifier
        fixedBody = 'Important: ' + fixedBody;
    }

    // 2. Fix variables at the very end
    if (fixedBody.endsWith('}}')) {
        // Append a period and a closing word or just more solid text
        fixedBody = fixedBody + ' immediately.';
    }

    // 3. Fix consecutive variables like {{1}}{{2}}
    // We'll add a space or a word between them
    fixedBody = fixedBody.replace(/(\}\})(\{\{)/g, '$1 $2');

    // 4. Double check if it ends with " ." and make it more natural
    if (fixedBody.endsWith(' .')) {
        fixedBody = fixedBody.replace(/ \.$/, ' today.');
    }

    return `body: "${fixedBody}"`;
});

fs.writeFileSync(filePath, content);
console.log('Refined templates library with more natural surrounding text.');
