import { mkdir } from "node:fs/promises";
import { ProjectContext } from "../../core/context.js";
import { ghResult$ } from "../../external-tools/index.js";
import { Preset } from "../internal/preset.js";
import { TemplateSource } from "../internal/source.js";
import { resolve } from "node:path";


export class NodeJSSQLitePreset extends Preset {
    public readonly TYPE = 'nodejs-sqlite';
    public readonly description = 'basic backend node.js package with fastify and sqlite setup with drizzle';

    // nodejs-sqlite is based on nodejs, sqlite template only has modifierd files
    private readonly source = new TemplateSource(['nodejs', 'nodejs-sqlite']);

    constructor() {
        super();
    }

    async execute(projectContext: ProjectContext, packageName: string): Promise<void> {
        await this.source.execute(projectContext, projectContext.paths.projectPackage(packageName), {
            substitutions: {
                ...await TemplateSource.getSubstitutions(projectContext),
                packageName
            }
        });

        await mkdir(resolve(projectContext.paths.projectPackage(packageName), 'drizzle'));
        
        await this.addDockerService(
            projectContext.paths.projectRoot,
            packageName,
            {
                image: `ghcr.io/${(await ghResult$).username ?? '<<FIXME>>'}/${projectContext.scaffoldOptions.projectLongName}/${packageName}:\${VERSION_TAG}`,
                container_name: `${projectContext.scaffoldOptions.projectShortName}_${packageName}`,
                environment: { PORT: 4000, DB_FILE_NAME: '/data/sqlite.db' },
                env_file: [{ path: `.${projectContext.scaffoldOptions.projectShortName}.env`, required: false }],
                volumes: ['./sqlite-data:/data'],
                restart: 'unless-stopped',
                healthcheck: {
                    test: 'wget --no-verbose --tries=1 --spider http://127.0.0.1:4000/health || exit 1',
                    interval: '30s',
                    timeout: '5s',
                    retries: 2,
                    start_period: '25s',
                    start_interval: '10s'
                },
                networks: ['default']
            }
        )
    }
}
