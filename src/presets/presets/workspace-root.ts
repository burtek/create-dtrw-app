import { mkdir } from "node:fs/promises";
import { ProjectContext } from "../../core/context.js";
import { Preset } from "../internal/preset.js";
import { TemplateSource } from "../internal/source.js";


export class WorkspaceRootPreset extends Preset {
    public readonly TYPE = 'workspace-root';
    public readonly description = 'Workspace Root';

    private readonly source = new TemplateSource('workspace-root');

    constructor() {
        super(false);
    }

    async execute(projectContext: ProjectContext, packageName: string): Promise<void> {
        await this.source.execute(projectContext, projectContext.paths.projectRoot, {
            substitutions: {
                ...await TemplateSource.getSubstitutions(projectContext),
                packageName
            }
        });

        await mkdir(projectContext.paths.projectPackages, { recursive: true });
    }
}
