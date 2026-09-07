import { ProjectContext } from "../../core/context.js";
import { ghResult$ } from "../../external-tools/index.js";
import { Preset } from "../internal/preset.js";
import { TemplateSource } from "../internal/source.js";


export class NodeJSPreset extends Preset {
    public readonly TYPE = 'nodejs';
    public readonly description = 'basic backend node.js package with fastify';

    private readonly source = new TemplateSource('nodejs');

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

        await this.addDockerService(
            projectContext.paths.projectRoot,
            packageName,
            {
                image: `ghcr.io/${(await ghResult$).username ?? '<<FIXME>>'}/${projectContext.scaffoldOptions.projectLongName}/${packageName}:\${VERSION_TAG}`,
                container_name: `${projectContext.scaffoldOptions.projectShortName}_${packageName}`,
                environment: { PORT: 4000 },
                env_file: [{ path: '.backend.env', required: false }],
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
