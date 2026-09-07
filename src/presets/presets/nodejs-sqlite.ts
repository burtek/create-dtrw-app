import { ProjectContext } from "../../core/context.js";
import { Preset } from "../internal/preset.js";
import { TemplateSource } from "../internal/source.js";


export class NodeJSSQLitePreset extends Preset {
    public readonly TYPE = 'nodejs-sqlite';
    public readonly description = 'basic backend node.js package with fastify and sqlite setup with drizzle';

    private readonly source = new TemplateSource('nodejs-sqlite');

    constructor() {
        super(false); // hide as unimplemented
    }

    async execute(projectContext: ProjectContext, packageName: string): Promise<void> {
        await this.source.execute(projectContext, projectContext.paths.projectPackage(packageName), {
            substitutions: {
                ...await TemplateSource.getSubstitutions(projectContext),
                packageName
            }
        });
    }
}
