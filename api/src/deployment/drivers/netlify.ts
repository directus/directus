import { InvalidCredentialsError, ServiceUnavailableError } from '@directus/errors';
import type { Credentials, Deployment, Details, Log, Options, Project, Status, TriggerResult } from '@directus/types';
import { NetlifyAPI } from '@netlify/api';
import { isNumber } from 'lodash-es';
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
}

const WS_CONNECTIONS = new Map<string, DeploymentConnection>();

const WS_IDLE_TIMEOUT = 60_000; // 60 seconds
const WS_CONNECTION_TIMEOUT = 10_000; // 10 seconds

// eslint-disable-next-line no-control-regex
const ANSI_REGEX = /[\x1b]\[[0-9;]*m/g;
const WS_URL = 'wss://socketeer.services.netlify.com/build/logs';

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
		const params: Record<string, string> = { per_page: '100' };

		const response = await this.handleApiError((api) => {
			return this.options.account_slug
				? api.listSitesForAccount({
						account_slug: this.options.account_slug,
						...params,
					})
				: api.listSites(params);
		});

		return response.map((site) => this.mapSiteBase(site));
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
		};

		return triggerResult;
	}

	async cancelDeployment(deploymentId: string): Promise<void> {
		await this.handleApiError((api) => api.cancelSiteDeploy({ deployId: deploymentId }));
		this.closeWsConnection(deploymentId);
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

			const connection: DeploymentConnection = {
				ws: new WebSocket(WS_URL),
				logs: [],
				deploymentId,
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

	async getDeploymentLogs(deploymentId: string, options?: { since?: Date }): Promise<Log[]> {
		const connection = await this.getWsConnection(deploymentId);

		if (options?.since) {
			return connection.logs.filter((log) => log.timestamp >= options.since!);
		}

		return connection.logs;
	}
}
