import { InvalidPayloadError } from '@directus/errors';
import type {
	AbstractServiceOptions,
	DeploymentConfig,
	PrimaryKey,
	Project as ProviderProject,
	ProviderType,
} from '@directus/types';
import getDatabase from '../database/index.js';
import { buildDriverFromConfig, readDeploymentConfig } from '../deployment.js';
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
	 * Find a project by external ID within a deployment. Returns null if not tracked.
	 * external_id is unique only per deployment, so the lookup must be scoped.
	 */
	async readByExternalId(deploymentId: string, externalId: string): Promise<DeploymentProject | null> {
		const results = await this.readByQuery({
			filter: { deployment: { _eq: deploymentId }, external_id: { _eq: externalId } },
			limit: 1,
		});

		return results?.[0] ?? null;
	}

	/**
	 * Find a tracked project by external ID or name (Cloudflare queue events use script name; Directus stores tag as external_id).
	 */
	async readByProviderReference(deploymentId: string, reference: string): Promise<DeploymentProject | null> {
		const results = await this.readByQuery({
			filter: {
				_and: [
					{ _or: [{ external_id: { _eq: reference } }, { name: { _eq: reference } }] },
					{ deployment: { _eq: deploymentId } },
				],
			},
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

		// Sync name and deployable
		const toUpdate = selectedProjects
			.map((dbProject) => {
				const providerProject = providerProjects.find((p) => p.id === dbProject.external_id);
				if (!providerProject) return null;

				return {
					id: dbProject.id,
					name: providerProject.name,
					deployable: providerProject.deployable,
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

	private async readConfig(provider: ProviderType): Promise<DeploymentConfig> {
		return readDeploymentConfig(this.knex, this.schema, provider);
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
		const driver = buildDriverFromConfig(config);
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
		const driver = buildDriverFromConfig(config);

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
}
