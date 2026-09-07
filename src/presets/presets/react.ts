import { ProjectContext } from "../../core/context.js";
import { ghResult$ } from "../../external-tools/index.js";
import { Preset } from "../internal/preset.js";
import { TemplateSource } from "../internal/source.js";


export class ReactPreset extends Preset {
    public readonly TYPE = 'reactjs';
    public readonly description = 'basic unstyled UI package with react framework';

    private readonly source = new TemplateSource('reactjs');

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
                environment: { '#API_URL': 'http://helloworld_backend:4000' },
                restart: 'unless-stopped',
                healthcheck: {
                    test: 'curl -f http://localhost/',
                    interval: '30s',
                    timeout: '5s',
                    retries: 2,
                    start_period: '5s',
                    start_interval: '5s'
                },
                networks: ['default', 'apps']
            }
        )
    }
}
