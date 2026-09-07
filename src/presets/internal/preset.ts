import { readFile, writeFile } from "node:fs/promises";
import { ProjectContext } from "../../core/context.js";
import { join } from "node:path";
import { parse, stringify } from "yaml";

export abstract class Preset {
    public readonly abstract TYPE: string;
    public readonly abstract description: string;

    constructor(public readonly show: boolean = true) {}

    abstract execute(
        projectContext: ProjectContext,
        packageName: string
    ): Promise<void>

    protected async addDockerService(
        rootDir: string,
        serviceName: string,
        serviceConfig: Record<string, unknown>
    ) {
        const path = join(rootDir, 'docker-compose.yml');
        const yaml = await readFile(path, 'utf8');
        const dockerCompose = parse(yaml);
        dockerCompose.services[serviceName] = serviceConfig;
        const updatedYaml = stringify(dockerCompose);
        await writeFile(path, updatedYaml, 'utf8');
    }
}
