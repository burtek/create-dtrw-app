import { mkdir, readdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import Handlebars from 'handlebars';

import { ProjectContext } from '../../core/context.js';
import { Dirent, existsSync } from 'node:fs';
import { ghResult$, gitResult$ } from '../../external-tools/index.js';


Handlebars.registerHelper(
    'capitalizeFirstLetter',
    function capitalizeFirstLetter(string: string) {
        return `${string[0].toUpperCase()}${string.slice(1)}`;
    }
);

export interface PresetSource<Params> {
    execute(context: ProjectContext, targetDir: string, params: Params): Promise<void>
}

interface TemplateSourceParams {
    /** all substitutions needed by any available preset/template */
    substitutions: {
        shortName: string;
        longName: string;

        repo: string | undefined; // slug
        author: string | undefined; // Name <email>

        packageName: string;
    };
}
export class TemplateSource implements PresetSource<TemplateSourceParams> {
    private static HBS_EXT = '.hbs';

    constructor(private readonly templateName: string) {}
    
    async execute(context: ProjectContext, targetDir: string, params: TemplateSourceParams) {
        const templatePath = resolve(dirname(context.generator.libRoot), 'templates', this.templateName);

        if (!existsSync(templatePath)) {
            throw new Error(`Template ${this.templateName} not found at ${templatePath}`);
        }
        
        await this.copyDirectory(templatePath, targetDir, params.substitutions);
    }

    private async copyDirectory(sourceDir: string, targetDir: string, substitutions: Record<string, unknown>) {
        await mkdir(targetDir, { recursive: true });

        const entries = await readdir(sourceDir, { withFileTypes: true });

        for (const entry of entries) {
            const sourcePath = join(sourceDir, entry.name);

            if (entry.isDirectory()) {
                await this.copyDirectory(
                    sourcePath,
                    join(targetDir, entry.name),
                    substitutions,
                );

                continue;
            }

            if (!entry.isFile()) {
                continue;
            }

            const isTemplate = entry.name.endsWith(TemplateSource.HBS_EXT);
            const targetName = isTemplate
                ? entry.name.slice(0, -TemplateSource.HBS_EXT.length)
                : entry.name;

            const targetPath = join(targetDir, targetName);

            if (isTemplate) {
                const source = await readFile(sourcePath, 'utf8');
                const template = Handlebars.compile(source);

                await writeFile(
                    targetPath,
                    template(substitutions),
                    'utf8',
                );
            } else {
                await copyFile(sourcePath, targetPath);
            }
        }
    }

    static async getSubstitutions(context: ProjectContext) {
        const [git, gh] = await Promise.allSettled([gitResult$, ghResult$]);

        return {
            shortName: context.scaffoldOptions.projectShortName,
            longName: context.scaffoldOptions.projectLongName,
            author: git.status === 'fulfilled' && git.value.available
                ? git.value.user && git.value.email
                    ? `${git.value.user} <${git.value.email}>`
                    : git.value.user || git.value.email || undefined
                : undefined,
            repo: gh.status === 'fulfilled' && gh.value.authenticated
                ? `${gh.value.username}/${context.scaffoldOptions.projectLongName}`
                : undefined
        } satisfies Partial<TemplateSourceParams['substitutions']>
    }
}

export class CommandSource implements PresetSource<never> {
    async execute(context: ProjectContext, targetDir: string, params: never): Promise<void> {
        throw new Error('Unimplemented');
    }
}

export class WebSource implements PresetSource<never> {
    async execute(context: ProjectContext, targetDir: string, params: never): Promise<void> {
        throw new Error('Unimplemented');
    }
}
