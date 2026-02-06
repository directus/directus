import type { Credentials, Deployment, Details, Log, Options, Project, Status, TriggerResult } from '@directus/types';
import { NetlifyAPI } from '@netlify/api';
import { DeploymentDriver } from '../deployment.js';

export interface NetlifyCredentials extends Credentials {
	access_token: string;
}

export interface NetlifyOptions extends Options {
	account_slug?: string;
}

type NetlifySite = Awaited<ReturnType<NetlifyAPI['getSite']>>;

export class NetlifyDriver extends DeploymentDriver<NetlifyCredentials, NetlifyOptions> {
	private api: NetlifyAPI;

	constructor(credentials: NetlifyCredentials, options: NetlifyOptions = {}) {
		super(credentials, options);
		this.api = new NetlifyAPI(this.credentials.access_token);
	}

	private mapStatus(netlifyState: string | undefined): Status {
		const normalized = netlifyState?.toLowerCase();

		switch (normalized) {
			case 'ready':
				return 'ready';
			case 'error':
				return 'error';
			case 'building':
				return 'building';
			case 'canceled':
			case 'cancelled':
				return 'canceled';
			case 'processing':
			case 'enqueued':
			case 'preparing':
			case 'new':
			case 'uploaded':
			default:
				return 'building';
		}
	}

	async testConnection(): Promise<void> {
		await this.api.listSites({ per_page: 1 });
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

		const response = this.options.account_slug ? await this.api.listSitesForAccount({
			account_slug: this.options.account_slug,
			...params
		}) : await this.api.listSites(params);

		return response.map((site) => this.mapSiteBase(site));
	}

	async getProject(projectId: string): Promise<Project> {
		const site = await this.api.getSite({ siteId: projectId });
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

	async listDeployments(projectId: string, limit = 20): Promise<Deployment[]> {
		const response = await this.api.listSiteDeploys({ site_id: projectId, per_page: limit });

		return response.map((deploy) => {
			const result: Deployment = {
				id: deploy.id!,
				project_id: deploy.site_id!,
				status: this.mapStatus(deploy.state),
				created_at: new Date(deploy.created_at!),
			};

			// Prefer ssl_url, then deploy_ssl_url, then url
			if (deploy.ssl_url) {
				result.url = deploy.ssl_url;
			} else if (deploy.deploy_ssl_url) {
				result.url = deploy.deploy_ssl_url;
			} else if (deploy.deploy_url) {
				result.url = deploy.deploy_url;
			} else if (deploy.url) {
				result.url = deploy.url;
			}

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
		const deploy = await this.api.getDeploy({ deployId: deploymentId });

		const result: Details = {
			id: deploy.id!,
			project_id: deploy.site_id!,
			status: this.mapStatus(deploy.state),
			created_at: new Date(deploy.created_at!),
		};

		// Prefer ssl_url, then deploy_ssl_url, then url
		if (deploy.ssl_url) {
			result.url = deploy.ssl_url;
		} else if (deploy.deploy_ssl_url) {
			result.url = deploy.deploy_ssl_url;
		} else if (deploy.deploy_url) {
			result.url = deploy.deploy_url;
		} else if (deploy.url) {
			result.url = deploy.url;
		}

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
		const buildResponse = await this.api.createSiteBuild({
			site_id: projectId,
			clear_cache: options?.clearCache || false,
		});

		const deployState = await this.api.getDeploy({ deployId: buildResponse.deploy_id! });

		const triggerResult: TriggerResult = {
			deployment_id: buildResponse.deploy_id!,
			status: this.mapStatus(deployState.state),
		};

		return triggerResult;
	}

	async cancelDeployment(deploymentId: string): Promise<void> {
		await this.api.deleteDeploy({ deployId: deploymentId });
	}

	async getDeploymentLogs(deploymentId: string, options?: { since?: Date }): Promise<Log[]> {
		return new Promise((resolve, reject) => {
			const ws = new WebSocket(`wss://socketeer.services.netlify.com/build/logs`);
			const logs: Log[] = [];
			const lastMessageTime = Date.now();
			const accessToken = this.credentials.access_token;
			const { onMessage, onError, onOpen, close } = this.createDeploymentLogsResolver(ws, options);

			ws.addEventListener('message', onMessage({ resolve, logs, lastMessageTime }));
			ws.addEventListener('error', onError({ reject }));
			ws.addEventListener('open', onOpen({ deploymentId,  accessToken }));

			const interval = setInterval(() => {
				if (ws.OPEN !== ws.readyState) return;

				// If no new messages have been received in the last second, assume logs are complete and close the connection
				if (Date.now() - lastMessageTime > 1000) {
					clearInterval(interval);
					close({ resolve, logs });
				}
			}, 1000);
		});
	}

	private createDeploymentLogsResolver(ws: WebSocket, options?: { since?: Date }) {
		function close(params: { resolve: (logs: Log[]) => void; logs: Log[] }) {
			ws.close();
			params.resolve(params.logs);
		}

		function onMessage(params: { resolve: (logs: Log[]) => void; logs: Log[]; lastMessageTime: number }) {
			// eslint-disable-next-line no-control-regex
			const ansiRegex = /[\x1b]\[[0-9;]*m/g;

			return (event: MessageEvent) => {
				const data = JSON.parse(event.data);
				if (options?.since && new Date(data.ts) < options.since) return;

				const cleanMessage = data.message.replace(/\r/g, '').replace(ansiRegex, '');

				params.logs.push({
					timestamp: new Date(data.ts),
					type: data.type === 'report' ? 'info' : 'stdout',
					message: cleanMessage,
				});

				if (data.type === 'report') {
					close(params);
				}
			};
		}

		function onError(params: { reject: (reason: string) => void }) {
			return (event: Event) => params.reject(`WebSocket error: ${event}`);
		}

		function onOpen(params: { deploymentId: string; accessToken: string }) {
			return () => {
				ws.send(
					JSON.stringify({
						deploy_id: params.deploymentId,
						access_token: params.accessToken,
					}),
				);
			};
		}

		return {
			onMessage,
			onError,
			onOpen,
			close,
		};
	}
}
