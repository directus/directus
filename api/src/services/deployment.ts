import { useEnv } from '@directus/env';
import {
	HitRateLimitError,
	InvalidPayloadError,
	InvalidProviderConfigError,
	ServiceUnavailableError,
} from '@directus/errors';
import type {
	AbstractServiceOptions,
	CachedResult,
	Credentials,
	DeploymentConfig,
	Options,
	PrimaryKey,
	Project,
	ProviderType,
	Query,
	Status,
	TriggerResult,
} from '@directus/types';
import { mergeFilters } from '@directus/utils';
import { has, isEmpty } from 'lodash-es';
import { getCache, getCacheValueWithTTL, setCacheValueWithExpiry } from '../cache.js';
import type { DeploymentDriver } from '../deployment/deployment.js';
import { getDeploymentDriver } from '../deployment.js';
import { useLogger } from '../logger/index.js';
import { getMilliseconds } from '../utils/get-milliseconds.js';
import { parseValue } from '../utils/parse-value.js';
import type { DeploymentProject } from './deployment-projects.js';
import { DeploymentProjectsService } from './deployment-projects.js';
import type { DeploymentRun } from './deployment-runs.js';
import { DeploymentRunsService } from './deployment-runs.js';
import { ItemsService } from './items.js';

const env = useEnv();
const DEPLOYMENT_CACHE_TTL = getMilliseconds(env['CACHE_DEPLOYMENT_TTL']) || 5000; // Default 5s
const SYNC_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

function resolveDeployHookLabelFromOptions(
	deploymentOptions: Options | null | undefined,
	projectExternalId: string,
	deployHookUrl: string,
): string | undefined {
	const hooks = (
		(deploymentOptions as Record<string, unknown>)?.['deploy_hooks_by_project'] as Record<string, unknown>
	)?.[projectExternalId];

	if (!Array.isArray(hooks)) return undefined;

	for (const entry of hooks) {
		const { url, name } = (entry ?? {}) as { url?: unknown; name?: unknown };
		if (typeof url !== 'string' || url.trim() !== deployHookUrl.trim()) continue;
		if (typeof name === 'string' && name.trim()) return name.trim().slice(0, 200);
	}

	return undefined;
}

/** Stored in `directus_deployment_runs.target` */
function deploymentRunTargetValue(
	preview: boolean,
	deployHookUrl: string | undefined,
	hookLabel: string | undefined,
): string {
	if (preview) return 'preview';

	if (deployHookUrl) {
		const label = (hookLabel && hookLabel.trim()) || 'Deploy hook';
		return `hook:${encodeURIComponent(label.slice(0, 200))}`;
	}

	return 'production';
}

export class DeploymentService extends ItemsService<DeploymentConfig> {
	constructor(options: AbstractServiceOptions) {
		super('directus_deployments', options);
	}

	private getProviderErrorReason(error: unknown): string {
		if (error && typeof error === 'object' && 'extensions' in error) {
			const extensions = (error as { extensions?: { reason?: unknown } }).extensions;

			if (typeof extensions?.reason === 'string' && extensions.reason.length > 0) {
				return extensions.reason;
			}
		}

		if (error instanceof Error && error.message.length > 0) {
			return error.message;
		}

		return 'Invalid config connection';
	}

	override async createOne(data: Partial<DeploymentConfig>, opts?: any): Promise<PrimaryKey> {
		const provider = data.provider as ProviderType | undefined;

		if (!provider) {
			throw new InvalidPayloadError({ reason: 'Provider is required' });
		}

		if (isEmpty(data.credentials)) {
			throw new InvalidPayloadError({ reason: 'Credentials are required' });
		}

		let credentials: Credentials;

		try {
			credentials = parseValue<Credentials>(data.credentials, {});
		} catch {
			throw new InvalidPayloadError({ reason: 'Credentials must be valid JSON' });
		}

		let options: Options | undefined;

		try {
			options = parseValue<Options | undefined>(data.options, undefined);
		} catch {
			throw new InvalidPayloadError({ reason: 'Options must be valid JSON' });
		}

		// Test connection before persisting
		const driver = getDeploymentDriver(provider, credentials, options);

		try {
			await driver.testConnection();
		} catch (error) {
			throw new InvalidProviderConfigError({ provider, reason: this.getProviderErrorReason(error) });
		}

		const payload: Partial<DeploymentConfig> = {
			...data,
			// Persist as string so payload service encrypts the value
			credentials: JSON.stringify(credentials) as unknown as Credentials,
		};

		if (!isEmpty(options)) {
			payload.options = JSON.stringify(options) as unknown as Options;
		}

		return super.createOne(payload, opts);
	}

	override async updateOne(key: PrimaryKey, data: Partial<DeploymentConfig>, opts?: any): Promise<PrimaryKey> {
		const hasCredentials = has(data, 'credentials');
		const hasOptions = has(data, 'options');

		if (!hasCredentials && !hasOptions) {
			return super.updateOne(key, data, opts);
		}

		const existing = await this.readOne(key);
		const provider = existing.provider as ProviderType;

		const internal = await this.readConfig(provider);
		let credentials: Credentials = parseValue<Credentials>(internal.credentials, {});

		if (hasCredentials) {
			try {
				const parsed = parseValue<Credentials>(data.credentials, {});
				credentials = { ...credentials, ...parsed };
			} catch {
				throw new InvalidPayloadError({ reason: 'Credentials must be valid JSON or object' });
			}
		}

		let options: Options | undefined | null = existing.options ?? undefined;

		if (hasOptions) {
			try {
				options = parseValue<Options | undefined>(data.options, undefined);
			} catch {
				throw new InvalidPayloadError({ reason: 'Options must be valid JSON' });
			}

			if (isEmpty(options)) {
				throw new InvalidPayloadError({ reason: 'Options must not be empty' });
			}
		}

		// Test connection before persisting
		const driver = getDeploymentDriver(provider, credentials, options);

		try {
			await driver.testConnection();
		} catch (error) {
			throw new InvalidProviderConfigError({ provider, reason: this.getProviderErrorReason(error) });
		}

		return super.updateOne(
			key,
			{
				credentials: JSON.stringify(credentials) as unknown as Credentials,
				...(!isEmpty(options) ? { options: JSON.stringify(options) as unknown as Options } : {}),
			},
			opts,
		);
	}

	/**
	 * Read deployment config by provider
	 */
	async readByProvider(provider: ProviderType, query?: Query): Promise<DeploymentConfig> {
		const results = await this.readByQuery({
			...query,
			filter: mergeFilters({ provider: { _eq: provider } }, query?.filter ?? null),
			limit: 1,
		});

		if (!results || results.length === 0) {
			throw new Error(`Deployment config for "${provider}" not found`);
		}

		return results[0]!;
	}

	/**
	 * Update deployment config by provider
	 */
	async updateByProvider(provider: ProviderType, data: Partial<DeploymentConfig>): Promise<PrimaryKey> {
		const deployment = await this.readByProvider(provider);
		return this.updateOne(deployment.id, data);
	}

	/**
	 * Delete deployment config by provider
	 */
	async deleteByProvider(provider: ProviderType): Promise<PrimaryKey> {
		const deployment = await this.readByProvider(provider);

		// Webhook cleanup
		if (deployment.webhook_ids && deployment.webhook_ids.length > 0) {
			try {
				const driver = await this.getDriver(provider);
				await driver.unregisterWebhook(deployment.webhook_ids);
			} catch (err) {
				const logger = useLogger();
				logger.error(`Failed to unregister webhook for ${provider}: ${err}`);
			}
		}

		return this.deleteOne(deployment.id);
	}

	/**
	 * Read deployment config with decrypted credentials (internal use)
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

	/**
	 * Get webhook config for a provider
	 */
	async getWebhookConfig(
		provider: ProviderType,
	): Promise<{ webhook_secret: string | null; credentials: Credentials; options: Options }> {
		const config = await this.readConfig(provider);

		return {
			webhook_secret: config.webhook_secret ?? null,
			credentials: parseValue<Credentials>(config.credentials, {}),
			options: parseValue<Options>(config.options, {}),
		};
	}

	/**
	 * Get a deployment driver instance with decrypted credentials
	 */
	async getDriver(provider: ProviderType): Promise<DeploymentDriver> {
		const deployment = await this.readConfig(provider);
		const credentials = parseValue<Credentials>(deployment.credentials, {});

		const options = {
			...parseValue<Options>(deployment.options, {}),
			_webhookIds: deployment.webhook_ids ?? [],
		};

		return getDeploymentDriver(deployment.provider, credentials, options);
	}

	/**
	 * Sync webhook registration with current tracked projects.
	 */
	async syncWebhook(provider: ProviderType): Promise<void> {
		const logger = useLogger();

		logger.debug(`[webhook:${provider}] Starting webhook sync`);

		const config = await this.readConfig(provider);

		const projectsService = new ItemsService<DeploymentProject>('directus_deployment_projects', {
			knex: this.knex,
			schema: this.schema,
			accountability: null,
		});

		const projects = await projectsService.readByQuery({
			filter: { deployment: { _eq: config.id } },
			limit: -1,
		});

		const projectExternalIds = projects.map((p) => p.external_id);
		const driver = await this.getDriver(provider);

		// No projects → unregister webhooks if any exist
		if (projectExternalIds.length === 0) {
			if (config.webhook_ids && config.webhook_ids.length > 0) {
				logger.debug(`[webhook:${provider}] No projects, unregistering ${config.webhook_ids.length} webhook(s)`);

				try {
					await driver.unregisterWebhook(config.webhook_ids);
				} catch (err) {
					logger.warn(`[webhook:${provider}] Failed to unregister: ${err}`);
				}

				await super.updateOne(config.id, { webhook_ids: null, webhook_secret: null } as Partial<DeploymentConfig>);
			}

			return;
		}

		// Unregister existing webhooks before re-registering
		if (config.webhook_ids && config.webhook_ids.length > 0) {
			logger.debug(`[webhook:${provider}] Unregistering ${config.webhook_ids.length} existing webhook(s)`);

			try {
				await driver.unregisterWebhook(config.webhook_ids);
			} catch (err) {
				logger.warn(`[webhook:${provider}] Failed to unregister: ${err}`);
			}
		}

		const publicUrl = env['PUBLIC_URL'] as string;
		const webhookUrl = `${publicUrl}/deployments/webhooks/${provider}`;

		logger.debug(
			`[webhook:${provider}] Registering webhook → ${webhookUrl} for ${projectExternalIds.length} project(s)`,
		);

		const result = await driver.registerWebhook(webhookUrl, projectExternalIds);

		await super.updateOne(config.id, {
			webhook_ids: result.webhook_ids,
			webhook_secret: result.webhook_secret,
		} as Partial<DeploymentConfig>);

		logger.info(
			`[webhook:${provider}] Registered ${result.webhook_ids.length} webhook(s): [${result.webhook_ids.join(', ')}]`,
		);
	}

	/**
	 * List projects from provider with caching
	 */
	async listProviderProjects(provider: ProviderType): Promise<CachedResult<Project[]>> {
		const cacheKey = `${provider}:projects`;
		const { deploymentCache } = getCache();

		// Check cache first
		const cached = await getCacheValueWithTTL(deploymentCache, cacheKey);

		if (cached) {
			return { data: cached.data, remainingTTL: cached.remainingTTL };
		}

		// Fetch from driver
		const driver = await this.getDriver(provider);
		const projects = await driver.listProjects();

		// Store in cache
		await setCacheValueWithExpiry(deploymentCache, cacheKey, projects, DEPLOYMENT_CACHE_TTL);

		// Return with full TTL (just cached)
		return { data: projects, remainingTTL: DEPLOYMENT_CACHE_TTL };
	}

	/**
	 * Get project details from provider with caching
	 */
	async getProviderProject(provider: ProviderType, projectId: string): Promise<CachedResult<Project>> {
		const cacheKey = `${provider}:project:${projectId}`;
		const { deploymentCache } = getCache();

		// Check cache first
		const cached = await getCacheValueWithTTL(deploymentCache, cacheKey);

		if (cached) {
			return { data: cached.data, remainingTTL: cached.remainingTTL };
		}

		// Fetch from driver
		const driver = await this.getDriver(provider);
		const project = await driver.getProject(projectId);

		// Store in cache
		await setCacheValueWithExpiry(deploymentCache, cacheKey, project, DEPLOYMENT_CACHE_TTL);

		// Return with full TTL (just cached)
		return { data: project, remainingTTL: DEPLOYMENT_CACHE_TTL };
	}

	/**
	 * Dashboard: projects + latest run status + stats
	 */
	async getDashboard(
		provider: ProviderType,
		sinceDate: Date,
	): Promise<{
		projects: any[];
		stats: { active_deployments: number; successful_builds: number; failed_builds: number };
	}> {
		const projectsService = new DeploymentProjectsService({
			accountability: this.accountability,
			schema: this.schema,
		});

		const runsService = new DeploymentRunsService({
			accountability: this.accountability,
			schema: this.schema,
		});

		const deployment = await this.readByProvider(provider);

		const selectedProjects = await projectsService.readByQuery({
			filter: { deployment: { _eq: deployment.id } },
			limit: -1,
		});

		if (selectedProjects.length === 0) {
			return {
				projects: [],
				stats: { active_deployments: 0, successful_builds: 0, failed_builds: 0 },
			};
		}

		const projectIds = selectedProjects.map((p) => p.id);

		// Latest run per project + aggregated stats
		const [latestRuns, activeResult, statusCounts] = await Promise.all([
			Promise.all(
				projectIds.map(async (projectId) => {
					const runs = await runsService.readByQuery({
						filter: { project: { _eq: projectId } },
						sort: ['-date_created'],
						limit: 1,
					});

					return { projectId, run: runs?.[0] ?? null };
				}),
			),
			runsService.readByQuery({
				filter: { project: { _in: projectIds }, status: { _eq: 'building' } },
				aggregate: { count: ['*'] },
			}) as Promise<any[]>,
			runsService.readByQuery({
				filter: {
					_and: [
						{ project: { _in: projectIds } },
						{ status: { _in: ['ready', 'error'] } },
						{ date_created: { _gte: sinceDate.toISOString() } },
					],
				},
				aggregate: { count: ['*'] },
				group: ['status'],
			}) as Promise<any[]>,
		]);

		const latestRunMap = new Map(latestRuns.map((r) => [r.projectId, r.run]));

		const countByStatus = (status: string) =>
			Number(statusCounts.find((r: any) => r['status'] === status)?.['count'] ?? 0);

		// Background sync of project metadata if stale
		this.syncProjectMetadataIfStale(provider, deployment).catch((err) => {
			const logger = useLogger();
			logger.error(`Failed to sync project metadata for ${provider}: ${err}`);
		});

		return {
			projects: selectedProjects.map((p) => {
				const latestRun = latestRunMap.get(p.id);

				return {
					id: p.id,
					external_id: p.external_id,
					name: p.name,
					url: p.url,
					framework: p.framework,
					deployable: p.deployable,
					...(latestRun && {
						latest_deployment: {
							status: latestRun.status,
							created_at: latestRun.started_at ?? latestRun.date_created,
							finished_at: latestRun.completed_at ?? null,
						},
					}),
				};
			}),
			stats: {
				active_deployments: Number(activeResult[0]?.['count'] ?? 0),
				successful_builds: countByStatus('ready'),
				failed_builds: countByStatus('error'),
			},
		};
	}

	/**
	 * Refresh project metadata (name, url, framework, deployable) if stale.
	 */
	private async syncProjectMetadataIfStale(
		provider: ProviderType,
		deployment: { id: string; last_synced_at: string | null },
	): Promise<void> {
		if (deployment.last_synced_at) {
			const lastSync = new Date(deployment.last_synced_at).getTime();

			if (Date.now() - lastSync < SYNC_THRESHOLD_MS) return;
		}

		const logger = useLogger();
		logger.debug(`[metadata:${provider}] Syncing project metadata`);

		const projectsService = new DeploymentProjectsService({
			accountability: null,
			schema: this.schema,
		});

		const driver = await this.getDriver(provider);

		const selectedProjects = await projectsService.readByQuery({
			filter: { deployment: { _eq: deployment.id } },
			limit: -1,
		});

		// Fetch details per project
		const updates = await Promise.all(
			selectedProjects.map(async (p) => {
				const details = await driver.getProject(p.external_id);

				return {
					id: p.id,
					name: details.name,
					url: details.url ?? null,
					framework: details.framework ?? null,
					deployable: details.deployable,
				};
			}),
		);

		if (updates.length > 0) {
			await projectsService.updateBatch(updates);
		}

		// Mark sync timestamp
		const internalService = new DeploymentService({
			accountability: null,
			schema: this.schema,
		});

		await internalService.updateOne(deployment.id, { last_synced_at: new Date().toISOString() });
	}

	/**
	 * Trigger a deployment for a project
	 */
	async triggerDeployment(
		provider: ProviderType,
		projectId: string,
		options: { preview: boolean; clearCache: boolean; deployHookUrl?: string },
	): Promise<DeploymentRun> {
		const projectsService = new DeploymentProjectsService({
			accountability: this.accountability,
			schema: this.schema,
		});

		const runsService = new DeploymentRunsService({
			accountability: this.accountability,
			schema: this.schema,
		});

		const project = await projectsService.readOne(projectId);
		let driver = await this.getDriver(provider);
		const capabilities = driver.capabilities;

		if (options.preview && !capabilities.supportsPreviewDeploy) {
			throw new InvalidPayloadError({ reason: 'Preview deployments are not supported for this provider' });
		}

		if (options.deployHookUrl && !capabilities.supportsDeployHookUrl) {
			throw new InvalidPayloadError({ reason: 'Deploy hook deployments are not supported for this provider' });
		}

		let result: TriggerResult;

		const driverOptions = {
			preview: options.preview,
			clearCache: options.clearCache,
			...(options.deployHookUrl ? { deployHookUrl: options.deployHookUrl } : {}),
		};

		try {
			result = await driver.triggerRun(project.external_id, driverOptions);
		} catch (error) {
			const reason =
				error && typeof error === 'object' && 'extensions' in error
					? (error as { extensions?: { reason?: string } }).extensions?.reason
					: undefined;

			const missingTrigger =
				typeof reason === 'string' &&
				reason.includes('no build trigger configured') &&
				capabilities.eventsTransport === 'poll';

			if (!missingTrigger) {
				throw error;
			}

			// Sync trigger metadata on demand for poll-only providers (eg. Cloudflare) and retry once.
			await this.syncWebhook(provider);
			driver = await this.getDriver(provider);
			result = await driver.triggerRun(project.external_id, driverOptions);
		}

		const deploymentRow = await this.readConfig(provider);
		const deploymentOptions = parseValue<Options>(deploymentRow.options, {});

		const hookLabel = options.deployHookUrl
			? resolveDeployHookLabelFromOptions(deploymentOptions, project.external_id, options.deployHookUrl)
			: undefined;

		const runId = await runsService.createOne({
			project: projectId,
			external_id: result.deployment_id,
			target: deploymentRunTargetValue(options.preview, options.deployHookUrl, hookLabel),
			status: result.status,
			started_at: result.created_at.toISOString(),
			...(result.url ? { url: result.url } : {}),
		});

		return runsService.readOne(runId);
	}

	/**
	 * Cancel a deployment run
	 */
	async cancelDeployment(provider: ProviderType, runId: string): Promise<DeploymentRun> {
		const runsService = new DeploymentRunsService({
			accountability: this.accountability,
			schema: this.schema,
		});

		const run = await runsService.readOne(runId);
		const driver = await this.getDriver(provider);

		const status = await driver.cancelRun(run.external_id);
		await runsService.updateOne(runId, { status });

		return runsService.readOne(runId);
	}

	/**
	 * Get a run with its logs from the provider
	 */
	async getRunWithLogs(provider: ProviderType, runId: string, since?: Date): Promise<DeploymentRun & { logs: any }> {
		const runsService = new DeploymentRunsService({
			accountability: this.accountability,
			schema: this.schema,
		});

		const run = await runsService.readOne(runId);
		const driver = await this.getDriver(provider);
		const terminalStatuses = new Set<Status>(['ready', 'error', 'canceled']);

		if (driver.capabilities.needsRunStatusPolling && !terminalStatuses.has(run.status as Status)) {
			try {
				// getRun fetches status and logs in one combined call — don't also call getRunLogs.
				const details = await driver.getRun(run.external_id);
				const nextStatus = details.status;
				const update: Partial<DeploymentRun> = {};

				if (nextStatus !== run.status) {
					update.status = nextStatus;
				}

				if (details.url && details.url !== run.url) {
					update.url = details.url;
				}

				if (terminalStatuses.has(nextStatus) && !run.completed_at) {
					update.completed_at = new Date().toISOString();
				}

				if (Object.keys(update).length > 0) {
					await runsService.updateOne(run.id, update);
					return { ...run, ...update, logs: details.logs ?? [] };
				}

				return { ...run, logs: details.logs ?? [] };
			} catch (error) {
				if (error instanceof HitRateLimitError || error instanceof ServiceUnavailableError) throw error;

				const update: Partial<DeploymentRun> = {
					status: 'error',
					completed_at: run.completed_at ?? new Date().toISOString(),
				};

				await runsService.updateOne(run.id, update);
				return { ...run, ...update, logs: [] };
			}
		}

		try {
			const logs = await driver.getRunLogs(run.external_id, since ? { since } : undefined);
			return { ...run, logs };
		} catch (error) {
			const logger = useLogger();

			logger.warn(
				`[deployment:${provider}] Failed to fetch logs for run "${run.external_id}", returning run without logs: ${String(error)}`,
			);

			return { ...run, logs: [] };
		}
	}

	/**
	 * Refresh non-terminal run statuses for poll-based providers.
	 */
	async refreshRunsStatuses(provider: ProviderType, runs: DeploymentRun[]): Promise<DeploymentRun[]> {
		if (runs.length === 0) return runs;

		const driver = await this.getDriver(provider);
		if (!driver.capabilities.needsRunStatusPolling) return runs;

		const runsService = new DeploymentRunsService({
			accountability: this.accountability,
			schema: this.schema,
		});

		const terminalStatuses = new Set<Status>(['ready', 'error', 'canceled']);
		const refreshedRuns = [...runs];

		await Promise.all(
			runs.map(async (run, index) => {
				if (terminalStatuses.has(run.status as Status)) return;

				try {
					const details = await driver.getRun(run.external_id);
					const nextStatus = details.status;
					const update: Partial<DeploymentRun> = {};

					if (nextStatus !== run.status) {
						update.status = nextStatus;
					}

					if (details.url && details.url !== run.url) {
						update.url = details.url;
					}

					if (terminalStatuses.has(nextStatus) && !run.completed_at) {
						update.completed_at = new Date().toISOString();
					}

					if (Object.keys(update).length > 0) {
						await runsService.updateOne(run.id, update);
						refreshedRuns[index] = { ...run, ...update };
					}
				} catch (error) {
					if (error instanceof HitRateLimitError || error instanceof ServiceUnavailableError) return;

					const update: Partial<DeploymentRun> = {
						status: 'error',
						completed_at: run.completed_at ?? new Date().toISOString(),
					};

					await runsService.updateOne(run.id, update);
					refreshedRuns[index] = { ...run, ...update };
				}
			}),
		);

		return refreshedRuns;
	}
}
