import { randomBytes, timingSafeEqual } from 'node:crypto';
import { InvalidCredentialsError, ServiceUnavailableError } from '@directus/errors';
import type {
	Credentials,
	Deployment,
	DeploymentWebhookEvent,
	DeploymentWebhookEventType,
	Details,
	Log,
	Options,
	Project,
	Status,
	TriggerResult,
	WebhookRegistrationResult,
} from '@directus/types';
import { NetlifyAPI } from '@netlify/api';
import { isNumber } from 'lodash-es';
import { useLogger } from '../../logger/index.js';
import { DeploymentDriver } from '../deployment.js';

export interface NetlifyCredentials extends Credentials {
	access_token: string;
}

export interface NetlifyOptions extends Options {
	account_slug?: string;
}

type NetlifySite = Awaited<ReturnType<NetlifyAPI['getSite']>>;

interface DeploymentConnection {
	ws: WebSocket;
	logs: Log[];
	idleTimeout?: NodeJS.Timeout | undefined;
	connectionTimeout?: NodeJS.Timeout | undefined;
	deploymentId: string;
	completed: Promise<void>;
	resolveCompleted: () => void;
}

const WS_CONNECTIONS = new Map<string, DeploymentConnection>();

const WS_IDLE_TIMEOUT = 60_000; // 60 seconds
const WS_CONNECTION_TIMEOUT = 10_000; // 10 seconds

// eslint-disable-next-line no-control-regex
const ANSI_REGEX = /[\x1b]\[[0-9;]*m/g;
const WS_URL = 'wss://socketeer.services.netlify.com/build/logs';

const NETLIFY_WEBHOOK_EVENTS = ['deploy_created', 'deploy_building', 'deploy_failed'];

// Map Netlify deploy state to our normalized types
const STATE_TO_EVENT: Record<string, { type: DeploymentWebhookEventType; status: Status }> = {
	building: { type: 'deployment.created', status: 'building' },
	ready: { type: 'deployment.succeeded', status: 'ready' },
	error: { type: 'deployment.error', status: 'error' },
};

export class NetlifyDriver extends DeploymentDriver<NetlifyCredentials, NetlifyOptions> {
	private api: NetlifyAPI;

	constructor(credentials: NetlifyCredentials, options: NetlifyOptions = {}) {
		super(credentials, options);
		this.api = new NetlifyAPI(this.credentials.access_token);
	}

	private async handleApiError<T>(cb: (api: NetlifyAPI) => Promise<T>) {
		try {
			return await cb(this.api);
		} catch (error) {
			if (error instanceof Error && 'status' in error && isNumber(error.status) && error.status >= 400) {
				if (error.status === 401 || error.status === 403) {
					throw new InvalidCredentialsError();
				}

				throw new ServiceUnavailableError({ service: 'netlify', reason: 'Netlify API error: ' + error.message });
			}

			throw error;
		}
	}

	private mapStatus(netlifyState: string | undefined): Status {
		const normalized = netlifyState?.toLowerCase();

		switch (normalized) {
			case 'ready':
				return 'ready';
			case 'error':
				return 'error';
			case 'canceled':
				return 'canceled';
			default:
				return 'building';
		}
	}

	async testConnection(): Promise<void> {
		await this.handleApiError((api) => api.listSites({ per_page: 1 }));
	}

	private mapSiteBase(site: NetlifySite): Project {
		const result: Project = {
			id: site.id!,
			name: site.name!,
			deployable: Boolean(site.build_settings?.provider && site.build_settings?.repo_url),
		};

		// Use custom domain if available, otherwise ssl_url or url
		if (site.custom_domain) {
			result.url = `https://${site.custom_domain}`;
		} else if (site.ssl_url) {
			result.url = site.ssl_url;
		} else if (site.url) {
			result.url = site.url;
		}

		return result;
	}

	async listProjects(): Promise<Project[]> {
		const allSites: any[] = [];
		const perPage = 100;
		let hasMore = true;

		for (let page = 1; hasMore; page++) {
			const params: Record<string, string> = { per_page: String(perPage), page: String(page) };

			const response = await this.handleApiError((api) => {
				return this.options.account_slug
					? api.listSitesForAccount({
							account_slug: this.options.account_slug,
							...params,
						})
					: api.listSites(params);
			});

			allSites.push(...response);
			hasMore = response.length >= perPage;
		}

		return allSites.map((site) => this.mapSiteBase(site));
	}

	async getProject(projectId: string): Promise<Project> {
		const site = await this.handleApiError((api) => api.getSite({ siteId: projectId }));
		const result = this.mapSiteBase(site);

		// Add published deploy info if available
		if (site.published_deploy) {
			const deploy = site.published_deploy;

			if (deploy.state && deploy.created_at) {
				result.latest_deployment = {
					status: this.mapStatus(deploy.state),
					created_at: new Date(deploy.created_at),
					...(deploy.published_at && { finished_at: new Date(deploy.published_at) }),
				};
			}
		}

		if (site.created_at) {
			result.created_at = new Date(site.created_at);
		}

		if (site.updated_at) {
			result.updated_at = new Date(site.updated_at);
		}

		return result;
	}

	private mapDeployUrl(deploy: Record<string, any>): string | undefined {
		return deploy['ssl_url'] ?? deploy['deploy_ssl_url'] ?? deploy['deploy_url'] ?? deploy['url'];
	}

	async listDeployments(projectId: string, limit = 20): Promise<Deployment[]> {
		const response = await this.handleApiError((api) => api.listSiteDeploys({ site_id: projectId, per_page: limit }));

		return response.map((deploy) => {
			const result: Deployment = {
				id: deploy.id!,
				project_id: deploy.site_id!,
				status: this.mapStatus(deploy.state),
				created_at: new Date(deploy.created_at!),
			};

			const url = this.mapDeployUrl(deploy);
			if (url) result.url = url;

			if (deploy.published_at) {
				result.finished_at = new Date(deploy.published_at);
			}

			if (deploy.error_message) {
				result.error_message = deploy.error_message;
			}

			return result;
		});
	}

	async getDeployment(deploymentId: string): Promise<Details> {
		const deploy = await this.handleApiError((api) => api.getDeploy({ deployId: deploymentId }));

		const result: Details = {
			id: deploy.id!,
			project_id: deploy.site_id!,
			status: this.mapStatus(deploy.state),
			created_at: new Date(deploy.created_at!),
		};

		const url = this.mapDeployUrl(deploy);
		if (url) result.url = url;

		if (deploy.published_at) {
			result.finished_at = new Date(deploy.published_at);
		}

		if (deploy.error_message) {
			result.error_message = deploy.error_message;
		}

		return result;
	}

	async triggerDeployment(
		projectId: string,
		options?: { preview?: boolean; clearCache?: boolean },
	): Promise<TriggerResult> {
		// Netlify builds endpoint returns a Build object with deploy_id and deploy_state
		const buildResponse = await this.handleApiError((api) =>
			api.createSiteBuild({
				site_id: projectId,
				clear_cache: options?.clearCache || false,
			}),
		);

		const deployState = await this.handleApiError((api) => api.getDeploy({ deployId: buildResponse.deploy_id! }));

		const triggerResult: TriggerResult = {
			deployment_id: buildResponse.deploy_id!,
			status: this.mapStatus(deployState.state),
			created_at: new Date(deployState.created_at!),
		};

		return triggerResult;
	}

	async cancelDeployment(deploymentId: string): Promise<Status> {
		try {
			await this.handleApiError((api) => api.cancelSiteDeploy({ deployId: deploymentId }));
			this.closeWsConnection(deploymentId);

			return 'canceled';
		} catch {
			const details = await this.getDeployment(deploymentId);

			if (details.status !== 'building') {
				this.closeWsConnection(deploymentId);
				return details.status;
			}

			throw new ServiceUnavailableError({
				service: 'netlify',
				reason: `Could not cancel the deployment: ${deploymentId}`,
			});
		}
	}

	private closeWsConnection(deploymentId: string, remove = true): void {
		const connection = WS_CONNECTIONS.get(deploymentId);

		if (!connection) return;

		connection.ws.close();

		if (remove) {
			WS_CONNECTIONS.delete(deploymentId);
		}
	}

	private setupWsIdleTimeout(connection: DeploymentConnection): void {
		if (connection.idleTimeout) {
			clearTimeout(connection.idleTimeout);
		}

		connection.idleTimeout = setTimeout(() => {
			this.closeWsConnection(connection.deploymentId);
		}, WS_IDLE_TIMEOUT);
	}

	private setupWsConnectionTimeout(connection: DeploymentConnection, reject: (error: Error) => void): void {
		if (connection.connectionTimeout) {
			clearTimeout(connection.connectionTimeout);
		}

		connection.connectionTimeout = setTimeout(() => {
			this.closeWsConnection(connection.deploymentId);
			reject(new ServiceUnavailableError({ service: 'netlify', reason: 'WebSocket connection timeout' }));
		}, WS_CONNECTION_TIMEOUT);
	}

	private getWsConnection(deploymentId: string): Promise<DeploymentConnection> {
		return new Promise((resolve, reject) => {
			const existingConnection = WS_CONNECTIONS.get(deploymentId);

			if (existingConnection) {
				this.setupWsIdleTimeout(existingConnection);
				return resolve(existingConnection);
			}

			let resolveCompleted: () => void;

			const completed = new Promise<void>((res) => {
				resolveCompleted = res;
			});

			const connection: DeploymentConnection = {
				ws: new WebSocket(WS_URL),
				logs: [],
				deploymentId,
				completed,
				resolveCompleted: resolveCompleted!,
			};

			this.setupWsConnectionTimeout(connection, reject);

			connection.ws.addEventListener('open', () => {
				if (connection.connectionTimeout) {
					clearTimeout(connection.connectionTimeout);
					connection.connectionTimeout = undefined;
				}

				this.setupWsIdleTimeout(connection);

				const payload = JSON.stringify({
					deploy_id: deploymentId,
					access_token: this.credentials.access_token,
				});

				connection.ws.send(payload);

				resolve(connection);
				WS_CONNECTIONS.set(deploymentId, connection);
			});

			connection.ws.addEventListener('message', (event) => {
				const data = JSON.parse(event.data);
				const cleanMessage = data.message.replace(/\r/g, '').replace(ANSI_REGEX, '');
				let logType: 'info' | 'stdout' | 'stderr' = 'stdout';

				if (data.type === 'report') {
					logType = cleanMessage.includes('Failing build') ? 'stderr' : 'info';
				}

				connection.logs.push({
					timestamp: new Date(data.ts),
					type: logType,
					message: cleanMessage,
				});

				// If we receive a "report" type message, the build is complete.
				// Close the WebSocket connection but don't yet remove the logs, allowing the client to fetch them until the idle timeout expires.
				if (data.type === 'report') {
					connection.resolveCompleted();
					this.closeWsConnection(deploymentId, false);
				}
			});

			connection.ws.addEventListener('error', () => {
				this.closeWsConnection(deploymentId);
				reject(new ServiceUnavailableError({ service: 'netlify', reason: 'WebSocket connection error' }));
			});

			connection.ws.addEventListener('close', () => {
				if (connection.connectionTimeout) {
					clearTimeout(connection.connectionTimeout);
				}
			});
		});
	}

	async registerWebhook(webhookUrl: string, projectIds: string[]): Promise<WebhookRegistrationResult> {
		const logger = useLogger();
		const secret = randomBytes(32).toString('hex');
		const hookIds: string[] = [];

		// Netlify API doesn't support JWS signing for API-created hooks,
		// so we inject a token for verification instead
		const signedUrl = `${webhookUrl}?token=${secret}`;

		for (const siteId of projectIds) {
			await this.cleanupStaleHooks(siteId, webhookUrl);
		}

		for (const siteId of projectIds) {
			for (const event of NETLIFY_WEBHOOK_EVENTS) {
				const hook = await this.handleApiError((api) =>
					api.createHookBySiteId({
						site_id: siteId,
						body: { type: 'url', event, data: { url: signedUrl } },
					}),
				);

				logger.debug(`[webhook:netlify] Created hook ${hook.id} for event ${event}`);
				hookIds.push(hook.id!);
			}
		}

		return { webhook_ids: hookIds, webhook_secret: secret };
	}

	private async cleanupStaleHooks(siteId: string, webhookUrl: string): Promise<void> {
		const logger = useLogger();

		const hooks = await this.handleApiError((api) => api.listHooksBySiteId({ site_id: siteId }));

		const staleHooks = hooks.filter((h: any) => h.data?.url?.startsWith(webhookUrl));

		if (staleHooks.length > 0) {
			logger.debug(`[webhook:netlify] Cleaning up ${staleHooks.length} stale hook(s) for site ${siteId}`);

			await Promise.allSettled(staleHooks.map((h: any) => this.api.deleteHook({ hook_id: h.id })));
		}
	}

	async unregisterWebhook(webhookIds: string[]): Promise<void> {
		await Promise.allSettled(webhookIds.map((id) => this.api.deleteHook({ hook_id: id })));
	}

	verifyAndParseWebhook(
		rawBody: Buffer,
		headers: Record<string, string | string[] | undefined>,
		webhookSecret: string,
	): DeploymentWebhookEvent | null {
		const logger = useLogger();

		// URL token verification — Netlify API doesn't support JWS signing for API-created hooks,
		// so we embed a secret token in the webhook URL and verify it here.
		// The token is passed via the 'x-webhook-token'
		const token = headers['x-webhook-token'];

		if (!token || typeof token !== 'string') {
			logger.warn(`[webhook:netlify] Missing webhook token`);
			return null;
		}

		const tokenBuf = Buffer.from(token);
		const secretBuf = Buffer.from(webhookSecret);

		if (tokenBuf.length !== secretBuf.length || !timingSafeEqual(tokenBuf, secretBuf)) {
			logger.warn(`[webhook:netlify] Token mismatch`);
			return null;
		}

		// Parse deploy object from body
		const deploy = JSON.parse(rawBody.toString('utf-8'));
		const state = this.mapStatus(deploy.state);
		const mapping = STATE_TO_EVENT[state];

		if (!mapping) {
			return null;
		}

		const url = deploy.ssl_url || deploy.deploy_ssl_url || deploy.url;

		return {
			type: mapping.type,
			provider: 'netlify',
			project_external_id: deploy.site_id,
			deployment_external_id: deploy.id,
			status: mapping.status,
			...(url ? { url } : {}),
			...(deploy.context ? { target: deploy.context } : {}),
			timestamp: new Date(deploy.created_at),
			raw: deploy,
		};
	}

	async getDeploymentLogs(deploymentId: string, options?: { since?: Date }): Promise<Log[]> {
		const deploy = await this.handleApiError((api) => api.getDeploy({ deployId: deploymentId }));
		const connection = await this.getWsConnection(deploymentId);

		// Build already finished — WS is replaying logs, wait for all of them
		if (this.mapStatus(deploy.state) !== 'building') {
			await connection.completed;
		}

		if (options?.since) {
			return connection.logs.filter((log) => log.timestamp >= options.since!);
		}

		return connection.logs;
	}
}
