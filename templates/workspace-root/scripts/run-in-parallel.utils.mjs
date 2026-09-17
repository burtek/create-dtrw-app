const pkgColors = /** @type {const} */([ 'bgBlue', 'bgMagenta', 'bgGreen', 'bgCyan', 'bgRed', 'bgYellow' ]);
const cmdColors = /** @type {const} */([ 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan' ]);
const pkgIndexes = /** @type {string[]} */([]);
const cmdIndexes = /** @type {string[]} */([]);
/** @param {string} packageDirName */
export const getPackageColor = packageDirName => {
    let index = pkgIndexes.indexOf(packageDirName);
    if (index < 0) { index = pkgIndexes.push(packageDirName) - 1; }
    return pkgColors[index % pkgColors.length];
};
/** @param {string} packageDirName @param {string} scriptName */
export const getScriptColor = (packageDirName, scriptName) => {
    const key = scriptName // `${packageDirName}:${scriptName}`;
    let index = cmdIndexes.indexOf(key);
    if (index < 0) { index = cmdIndexes.push(key) - 1; }
    return cmdColors[index % cmdColors.length];
};

/**
* 
* @param {NodeJS.ReadableStream} stream
* @param {NodeJS.WritableStream} output
* @param {string} prefix
*/
export function pipeOutput(stream, output, prefix) {
    let buffer = '';
    
    stream.setEncoding('utf8');
    
    stream.on('data', chunk => {
        buffer += chunk;
        
        const lines = buffer.split(/\r?\n/);
        buffer = /** @type {string} */(lines.pop());
        
        for (const line of lines) {
            output.write(`${prefix} ${line}\n`);
        }
    });
    
    stream.on('end', () => {
        if (buffer) {
            process.stdout.write(`${prefix} ${buffer}\n`);
        }
    });
}

/**
* @param {string} string 
* @param {number} maxLength 
*/
export function padBothSides(string, maxLength) {
    const left = Math.floor((maxLength - string.length) / 2);
    
    return string.padEnd(maxLength - left).padStart(maxLength);
}
