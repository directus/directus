import { HitRateLimitError, InvalidCredentialsError, ServiceUnavailableError } from '@directus/errors';
import type { Credentials, Deployment, Details, Log, Options, Project, Status, TriggerResult } from '@directus/types';
import pLimit from 'p-limit';
import { DeploymentDriver } from '../deployment.js';

export interface VercelCredentials extends Credentials {
	access_token: string;
}

export interface VercelOptions extends Options {
	team_id?: string;
}

/**
 * Vercel API response types
 */
interface VercelProject {
	id: string;
	name: string;
	framework?: string;
	link?: {
		type?: string;
		productionBranch?: string;
		repoId?: string;
	};
	targets?: {
		production?: {
			alias?: string[];
			readyState?: string;
			createdAt?: number;
			readyAt?: number;
		};
	};
	createdAt?: number;
	updatedAt?: number;
}

interface VercelDeployment {
	uid: string;
	id: string;
	projectId?: string;
	state?: string;
	status?: string;
	url?: string;
	createdAt: number;
	ready?: number;
}

interface VercelEvent {
	type: string;
	created: number;
	payload?: {
		text?: string;
	};
	text?: string;
}

export class VercelDriver extends DeploymentDriver<VercelCredentials, VercelOptions> {
	private static readonly API_URL = 'https://api.vercel.com';
	private requestLimit = pLimit(5);

	constructor(credentials: VercelCredentials, options: VercelOptions = {}) {
		super(credentials, options);
	}

	/**
	 * Make authenticated request with retry on rate limit and concurrency control
	 */
	private async request<T>(
		endpoint: string,
		options: RequestInit & { params?: Record<string, string> } = {},
		retryCount = 0,
	): Promise<T> {
		return this.requestLimit(async () => {
			const { params, ...fetchOptions } = options;
			const url = new URL(endpoint, VercelDriver.API_URL);

			// Add team_id if configured
			if (this.options.team_id) {
				url.searchParams.set('teamId', this.options.team_id);
			}

			// Add custom params
			if (params) {
				for (const [key, value] of Object.entries(params)) {
					url.searchParams.set(key, value);
				}
			}

			const response = await fetch(url, {
				...fetchOptions,
				headers: {
					Authorization: `Bearer ${this.credentials.access_token}`,
					'Content-Type': 'application/json',
					...fetchOptions.headers,
				},
			});

			// Handle rate limiting with retry (max 3 retries)
			if (response.status === 429) {
				const resetAt = parseInt(response.headers.get('X-RateLimit-Reset') || '0');
				const limit = parseInt(response.headers.get('X-RateLimit-Limit') || '0');

				if (retryCount < 3) {
					const waitTime = resetAt > 0 ? Math.max(resetAt * 1000 - Date.now(), 1000) : 1000 * (retryCount + 1);
					await new Promise((resolve) => setTimeout(resolve, waitTime));
					return this.request(endpoint, options, retryCount + 1);
				}

				// Max retries exceeded
				throw new HitRateLimitError({
					limit,
					reset: new Date(resetAt > 0 ? resetAt * 1000 : Date.now()),
				});
			}

			const body = await response.json();

			if (!response.ok) {
				const message = body.error?.message || `Vercel API error: ${response.status}`;

				if (response.status === 401 || response.status === 403) {
					throw new InvalidCredentialsError();
				}

				throw new ServiceUnavailableError({ service: 'vercel', reason: message });
			}

			return body;
		});
	}

	private mapStatus(vercelStatus: string | undefined): Status {
		const normalized = vercelStatus?.toLowerCase();

		switch (normalized) {
			case 'ready':
				return 'ready';
			case 'error':
				return 'error';
			case 'canceled':
				return 'canceled';
			case 'queued':
			case 'initializing':
			case 'analyzing':
			case 'building':
			case 'deploying':
			default:
				return 'building';
		}
	}

	async testConnection(): Promise<void> {
		return await this.request('/v9/projects', { params: { limit: '1' } });
	}

	private mapProjectBase(project: VercelProject): Project {
		const result: Project = {
			id: project.id,
			name: project.name,
			deployable: Boolean(project.link?.type),
		};

		if (project.framework) {
			result.framework = project.framework;
		}

		return result;
	}

	async listProjects(): Promise<Project[]> {
		const response = await this.request<{ projects: VercelProject[] }>('/v9/projects');
		return response.projects.map((project) => this.mapProjectBase(project));
	}

	async getProject(projectId: string): Promise<Project> {
		const project = await this.request<VercelProject>(`/v9/projects/${projectId}`);
		const result = this.mapProjectBase(project);

		const production = project.targets?.production;

		if (production?.alias?.[0]) {
			result.url = `https://${production.alias[0]}`;
		}

		// Latest deployment info from detail endpoint
		if (production?.readyState && production.createdAt) {
			result.latest_deployment = {
				status: this.mapStatus(production.readyState),
				created_at: new Date(production.createdAt),
				...(production.readyAt && { finished_at: new Date(production.readyAt) }),
			};
		}

		if (project.createdAt) {
			result.created_at = new Date(project.createdAt);
		}

		if (project.updatedAt) {
			result.updated_at = new Date(project.updatedAt);
		}

		return result;
	}

	async listDeployments(projectId: string, limit = 20): Promise<Deployment[]> {
		const url = `/v6/deployments?projectId=${encodeURIComponent(projectId)}&limit=${limit}`;
		const response = await this.request<{ deployments: VercelDeployment[] }>(url);

		return response.deployments.map((deployment) => {
			const result: Deployment = {
				id: deployment.uid,
				project_id: deployment.projectId ?? projectId,
				status: this.mapStatus(deployment.state),
				created_at: new Date(deployment.createdAt),
			};

			if (deployment.url) {
				result.url = `https://${deployment.url}`;
			}

			if (deployment.ready) {
				result.finished_at = new Date(deployment.ready);
			}

			return result;
		});
	}

	async getDeployment(deploymentId: string): Promise<Details> {
		const deployment = await this.request<VercelDeployment>(`/v13/deployments/${encodeURIComponent(deploymentId)}`);

		const result: Details = {
			id: deployment.id,
			project_id: deployment.projectId ?? '',
			status: this.mapStatus(deployment.status || deployment.state),
			created_at: new Date(deployment.createdAt),
		};

		if (deployment.url) {
			result.url = `https://${deployment.url}`;
		}

		if (deployment.ready) {
			result.finished_at = new Date(deployment.ready);
		}

		return result;
	}

	async triggerDeployment(
		projectId: string,
		options?: { preview?: boolean; clearCache?: boolean },
	): Promise<TriggerResult> {
		// Fetch project to get realtime required name needed for the vercel request
		const project = await this.request<VercelProject>(`/v9/projects/${projectId}`);

		const body: Record<string, unknown> = {
			name: project.name,
			project: projectId,
			target: options?.preview ? 'preview' : 'production',
		};

		// Add required gitSource
		if (project.link?.type) {
			body['gitSource'] = {
				type: project.link.type,
				ref: project.link.productionBranch,
				repoId: project.link.repoId,
			};
		}

		// forceNew=1 skips build cache when clearCache is true
		const response = await this.request<VercelDeployment>('/v13/deployments', {
			method: 'POST',
			body: JSON.stringify(body),
			...(options?.clearCache && { params: { forceNew: '1' } }),
		});

		const triggerResult: TriggerResult = {
			deployment_id: response.id,
			status: this.mapStatus(response.status),
		};

		if (response.url) {
			triggerResult.url = `https://${response.url}`;
		}

		return triggerResult;
	}

	async cancelDeployment(deploymentId: string): Promise<void> {
		await this.request(`/v12/deployments/${encodeURIComponent(deploymentId)}/cancel`, {
			method: 'PATCH',
		});
	}

	async getDeploymentLogs(deploymentId: string, options?: { since?: Date }): Promise<Log[]> {
		let url = `/v3/deployments/${encodeURIComponent(deploymentId)}/events`;

		// Vercel's since parameter uses milliseconds timestamp
		if (options?.since) {
			const sinceMs = options.since.getTime();
			url += `?since=${sinceMs}`;
		}

		const response = await this.request<VercelEvent[]>(url);

		const mapEventType = (type: string): Log['type'] => {
			if (type === 'stderr') return 'stderr';
			if (type === 'command') return 'info';
			return 'stdout';
		};

		return response
			.filter((event) => event.type === 'stdout' || event.type === 'stderr' || event.type === 'command')
			.map((event) => ({
				timestamp: new Date(event.created),
				type: mapEventType(event.type),
				message: event.text || event.payload?.text || '',
			}));
	}
}
