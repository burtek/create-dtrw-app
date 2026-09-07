import { existsSync, readdirSync } from "node:fs";

const allPackages = readdirSync('./packages', { withFileTypes: true })
    .filter((file) => file.isDirectory() && !file.isSymbolicLink())
    .map((file) => `./packages/${file.name}/package.json`)
    .filter((file) => existsSync(file));

export default {
    packageFiles: ['package.json'],
    bumpFiles: ['package.json', ...allPackages]
}
