import { InvalidPayloadError } from '@directus/errors';
import type {
	AbstractServiceOptions,
	Credentials,
	DeploymentConfig,
	Options,
	PrimaryKey,
	Project as ProviderProject,
	ProviderType,
} from '@directus/types';
import getDatabase from '../database/index.js';
import type { DeploymentDriver } from '../deployment/deployment.js';
import { getDeploymentDriver } from '../deployment.js';
import { parseValue } from '../utils/parse-value.js';
import { transaction } from '../utils/transaction.js';
import { ItemsService } from './items.js';

export interface DeploymentProject {
	id: string;
	deployment: string;
	external_id: string;
	name: string;
	url: string | null;
	framework: string | null;
	deployable: boolean;
	date_created: string;
	user_created: string;
}

export class DeploymentProjectsService extends ItemsService<DeploymentProject> {
	constructor(options: AbstractServiceOptions) {
		super('directus_deployment_projects', options);
	}

	/**
	 * Find a project by its provider-side external ID. Returns null if not tracked.
	 */
	async readByExternalId(externalId: string): Promise<DeploymentProject | null> {
		const results = await this.readByQuery({
			filter: { external_id: { _eq: externalId } },
			limit: 1,
		});

		return results?.[0] ?? null;
	}

	/**
	 * List provider projects merged with DB selection, syncing metadata.
	 */
	async listWithSync(deploymentId: string, providerProjects: ProviderProject[]) {
		const selectedProjects = await this.readByQuery({
			filter: { deployment: { _eq: deploymentId } },
			limit: -1,
		});

		const selectedMap = new Map(selectedProjects.map((p) => [p.external_id, p]));

		// Sync metadata for selected projects
		const toUpdate = selectedProjects
			.map((dbProject) => {
				const providerProject = providerProjects.find((p) => p.id === dbProject.external_id);
				if (!providerProject) return null;

				return {
					id: dbProject.id,
					name: providerProject.name,
					deployable: providerProject.deployable,
					url: providerProject.url ?? null,
					framework: providerProject.framework ?? null,
				};
			})
			.filter((update) => update !== null);

		if (toUpdate.length > 0) {
			await this.updateBatch(toUpdate as Partial<DeploymentProject>[]);
		}

		return providerProjects.map((project) => ({
			id: selectedMap.get(project.id)?.id ?? null,
			external_id: project.id,
			name: project.name,
			deployable: project.deployable,
			framework: project.framework,
		}));
	}

	/**
	 * Validate that all projects to create are deployable.
	 */
	async validateDeployable(
		provider: ProviderType,
		projectsToCreate: { external_id: string; name: string }[],
	): Promise<void> {
		if (projectsToCreate.length === 0) return;

		const config = await this.readConfig(provider);
		const driver = this.createDriver(config);
		const providerProjects = await driver.listProjects();
		const projectsMap = new Map(providerProjects.map((p) => [p.id, p]));

		const nonDeployable = projectsToCreate.filter((p) => !projectsMap.get(p.external_id)?.deployable);

		if (nonDeployable.length > 0) {
			const names = nonDeployable.map((p) => projectsMap.get(p.external_id)?.name || p.external_id).join(', ');

			throw new InvalidPayloadError({
				reason: `Cannot add non-deployable projects: ${names}`,
			});
		}
	}

	/**
	 * Update project selection (create/delete)
	 */
	async updateSelection(
		provider: ProviderType,
		create: { external_id: string; name: string }[],
		deleteIds: PrimaryKey[],
	): Promise<DeploymentProject[]> {
		const config = await this.readConfig(provider);
		const db = getDatabase();
		const driver = this.createDriver(config);

		// Fetch metadata for new projects
		const enrichedCreate = await Promise.all(
			create.map(async (p) => {
				const details = await driver.getProject(p.external_id);

				return {
					external_id: p.external_id,
					name: p.name,
					url: details.url ?? null,
					framework: details.framework ?? null,
					deployable: details.deployable,
				};
			}),
		);

		return transaction(db, async (trx) => {
			const trxService = new DeploymentProjectsService({
				accountability: this.accountability,
				schema: this.schema,
				knex: trx,
			});

			if (deleteIds.length > 0) {
				await trxService.deleteMany(deleteIds);
			}

			if (enrichedCreate.length > 0) {
				await trxService.createMany(
					enrichedCreate.map((p) => ({
						deployment: config.id,
						external_id: p.external_id,
						name: p.name,
						url: p.url,
						framework: p.framework,
						deployable: p.deployable,
					})),
				);
			}

			return trxService.readByQuery({
				filter: { deployment: { _eq: config.id } },
				limit: -1,
			});
		});
	}

	/**
	 * Read deployment config by provider (null accountability for internal use).
	 */
	private async readConfig(provider: ProviderType): Promise<DeploymentConfig> {
		const internalService = new ItemsService<DeploymentConfig>('directus_deployments', {
			knex: this.knex,
			schema: this.schema,
			accountability: null,
		});

		const results = await internalService.readByQuery({
			filter: { provider: { _eq: provider } },
			limit: 1,
		});

		if (!results || results.length === 0) {
			throw new Error(`Deployment config for "${provider}" not found`);
		}

		return results[0]!;
	}

	private createDriver(config: DeploymentConfig): DeploymentDriver {
		const credentials = parseValue<Credentials>(config.credentials, {});
		const options = parseValue<Options>(config.options, {});

		return getDeploymentDriver(config.provider, credentials, options);
	}
}
