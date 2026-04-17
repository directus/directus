import {
	HitRateLimitError,
	InvalidCredentialsError,
	InvalidPayloadError,
	InvalidProviderConfigError,
	ServiceUnavailableError,
} from '@directus/errors';
import type {
	Credentials,
	Deployment,
	DeploymentWebhookEvent,
	Details,
	Log,
	Options,
	Project,
	Status,
	TriggerResult,
	WebhookRegistrationResult,
} from '@directus/types';
import pLimit from 'p-limit';
import { DeploymentDriver, type DeploymentRequestOptions } from '../deployment.js';

export interface CloudflareCredentials extends Credentials {
	api_token: string;
}

export interface CloudflareOptions extends Options {
	account_id: string;
	_webhookIds?: string[];
	/** Saved in Directus; keys are worker external IDs (tags) */
	deploy_hooks_by_project?: Record<string, Array<{ name?: string; url?: string }>>;
}

/**
 * Cloudflare API response shapes (Workers / Builds REST — subset used here)
 */
interface CloudflareApiError {
	message?: string;
}

interface CloudflareApiResponse<T> {
	success?: boolean;
	errors?: CloudflareApiError[];
	result?: T;
}

interface CloudflareWorker {
	id?: string;
	tag?: string;
	name?: string;
}

interface CloudflareBuild {
	id?: string;
	uuid?: string;
	build_uuid?: string;
	worker_tag?: string;
	status?: string;
	build_outcome?: string;
	url?: string;
	created_at?: string;
	created_on?: string;
	updated_at?: string;
	modified_on?: string;
	stopped_on?: string;
	finished_at?: string;
	completed_at?: string;
	error?: string;
	error_message?: string;
}

type CloudflareBuildLogLine = [number, string];

interface CloudflareBuildLogsResponse {
	cursor?: string;
	truncated?: boolean;
	lines?: CloudflareBuildLogLine[];
	events?: { type: string; started_on?: string; ended_on?: string }[];
}

interface CloudflareTrigger {
	id?: string;
	uuid?: string;
	trigger_uuid?: string;
	deploy_hook_id?: string;
	deploy_hook_url?: string;
	build_token_uuid?: string;
	name?: string;
	trigger_name?: string;
	type?: string;
	environment?: string;
	target?: string;
	branch?: string;
	branch_includes?: string[];
	branch_excludes?: string[];
}

export class CloudflareDriver extends DeploymentDriver<CloudflareCredentials, CloudflareOptions> {
	private static readonly API_URL = 'https://api.cloudflare.com/client/v4/';
	private requestLimit = pLimit(5);

	constructor(credentials: CloudflareCredentials, options: CloudflareOptions = {} as CloudflareOptions) {
		super(credentials, options, {
			eventsTransport: 'poll',
			supportsPreviewDeploy: false,
			supportsDeployHookUrl: true,
			needsRunStatusPolling: true,
		});
	}

	// --- Account & token (options / credentials)

	/**
	 * Cloudflare Account IDs are 32 hex characters. Users often paste UUID-style groups or extra whitespace.
	 */
	private normalizeAccountId(raw: string): string {
		const trimmed = raw.trim();

		if (!trimmed) {
			throw new InvalidProviderConfigError({
				provider: 'cloudflare',
				reason: 'Missing account_id in deployment options',
			});
		}

		if (/^[a-f0-9]{32}$/i.test(trimmed)) {
			return trimmed.toLowerCase();
		}

		const withoutHyphens = trimmed.replace(/-/g, '');

		if (/^[a-f0-9]{32}$/i.test(withoutHyphens)) {
			return withoutHyphens.toLowerCase();
		}

		const hexOnly = trimmed.replace(/[^a-f0-9]/gi, '');

		if (/^[a-f0-9]{32}$/i.test(hexOnly)) {
			return hexOnly.toLowerCase();
		}

		throw new InvalidProviderConfigError({
			provider: 'cloudflare',
			reason:
				'Invalid account_id. Use the 32-character Cloudflare Account ID (hex) from the dashboard overview or URL.',
		});
	}

	private get accountId(): string {
		const raw = this.options.account_id;

		if (raw === undefined || raw === null || String(raw).trim() === '') {
			throw new InvalidProviderConfigError({
				provider: 'cloudflare',
				reason: 'Missing account_id in deployment options',
			});
		}

		return this.normalizeAccountId(String(raw));
	}

	private get apiToken(): string {
		const apiToken = this.credentials.api_token?.trim();

		if (!apiToken) {
			throw new InvalidProviderConfigError({
				provider: 'cloudflare',
				reason: 'Missing api_token in deployment credentials',
			});
		}

		return apiToken;
	}

	private getErrorMessage(response: CloudflareApiResponse<unknown>, fallback: string): string {
		return response.errors?.[0]?.message || fallback;
	}

	/**
	 * Authenticated JSON API request with concurrency control (no webhook retries — use Retry-After on 429).
	 */
	private async request<T>(endpoint: string, options: DeploymentRequestOptions = {}): Promise<T> {
		const response = await this.requestLimit(async () =>
			this.axiosRequest<CloudflareApiResponse<T>>(CloudflareDriver.API_URL, endpoint, {
				...options,
				headers: {
					Authorization: `Bearer ${this.apiToken}`,
					'Content-Type': 'application/json',
					...(options.headers ?? {}),
				},
			}),
		);

		const body = response.data ?? {};

		if (response.status === 401 || response.status === 403) {
			throw new InvalidCredentialsError();
		}

		if (response.status === 429) {
			const resetHeader = response.headers['retry-after'];

			const reset = Number.isFinite(Number(resetHeader))
				? new Date(Date.now() + Number(resetHeader) * 1000)
				: new Date(Date.now() + 60_000);

			throw new HitRateLimitError({
				limit: Number(response.headers['x-ratelimit-limit'] ?? 0),
				reset,
			});
		}

		if (response.status >= 400) {
			throw new ServiceUnavailableError({
				service: 'cloudflare',
				reason: this.getErrorMessage(body, `Cloudflare API error: ${response.status}`),
			});
		}

		if (body.success === false) {
			throw new ServiceUnavailableError({
				service: 'cloudflare',
				reason: this.getErrorMessage(body, 'Cloudflare API request failed'),
			});
		}

		return (body.result ?? {}) as T;
	}

	// --- Status & deployment mapping

	/**
	 * Workers Builds API documents `status` as queued | initializing | running | stopped; when stopped, use
	 * `build_outcome` for success vs failure. We also map a few alternate/legacy `status` strings seen in the wild.
	 * Unknown or missing status is treated as in-progress (`building`) so we never falsely mark a run complete.
	 */
	private mapStatus(cloudflareStatus: string | undefined, buildOutcome?: string | undefined): Status {
		const status = cloudflareStatus?.toLowerCase();
		const outcome = buildOutcome?.toLowerCase();

		if (status === 'stopped') {
			if (outcome === 'success' || outcome === 'dce') return 'ready';
			if (outcome === 'fail' || outcome === 'failed') return 'error';
			if (outcome === 'canceled' || outcome === 'cancelled') return 'canceled';
			return 'ready';
		}

		switch (status) {
			case 'success':
				return 'ready';
			case 'failed':
				return 'error';
			case 'cancelled':
			case 'canceled':
				return 'canceled';
			case 'queued':
			case 'active':
			case 'initializing':
			case 'running':
			default:
				return 'building';
		}
	}

	private getBuildId(build: CloudflareBuild): string {
		return build.build_uuid ?? build.uuid ?? build.id ?? '';
	}

	private mapBuild(build: CloudflareBuild): Deployment {
		const result: Deployment = {
			id: this.getBuildId(build),
			project_id: build.worker_tag ?? '',
			status: this.mapStatus(build.status, build.build_outcome),
			created_at: new Date(build.created_at ?? build.created_on ?? build.updated_at ?? new Date().toISOString()),
		};

		if (build.url) result.url = build.url;

		const finishedAt = build.stopped_on ?? build.finished_at ?? build.completed_at;
		if (finishedAt) result.finished_at = new Date(finishedAt);

		const errorMsg = build.error_message ?? build.error;
		if (errorMsg) result.error_message = errorMsg;

		return result;
	}

	private extractLogs(payload: CloudflareBuildLogsResponse): Log[] {
		const lines = payload.lines ?? [];

		return lines.map(([timestampMs, text]) => ({
			timestamp: new Date(timestampMs),
			type: 'stdout' as const,
			message: text,
		}));
	}

	/** One row from GET /accounts/{id}/workers/scripts (maps to a Directus “project”). */
	private mapProject(worker: CloudflareWorker): Project {
		const id = worker.tag ?? worker.id ?? '';
		const name = worker.id ?? worker.name ?? worker.tag ?? '';

		return {
			id,
			name,
			deployable: true,
		};
	}

	// --- Triggers (stored as webhook_ids for compatibility with the deployment service)

	private async listTriggers(workerTag: string): Promise<CloudflareTrigger[]> {
		const result = await this.request<CloudflareTrigger[] | { triggers?: CloudflareTrigger[] }>(
			`accounts/${this.accountId}/builds/workers/${encodeURIComponent(workerTag)}/triggers`,
		);

		return Array.isArray(result) ? result : (result.triggers ?? []);
	}

	private async hasBuildTrigger(workerTag: string): Promise<boolean> {
		const triggers = await this.listTriggers(workerTag);
		return triggers.length > 0;
	}

	private getTriggerUuid(trigger: CloudflareTrigger | undefined): string | null {
		if (!trigger) return null;
		return trigger.trigger_uuid ?? trigger.uuid ?? trigger.id ?? null;
	}

	private getTriggerBranch(trigger: CloudflareTrigger | undefined): string | null {
		if (!trigger) return null;
		if (trigger.branch && trigger.branch !== '*') return trigger.branch;
		return trigger.branch_includes?.find((value) => value !== '*') ?? null;
	}

	private isProductionTrigger(trigger: CloudflareTrigger): boolean {
		const values = [trigger.type, trigger.environment, trigger.target, trigger.name, trigger.trigger_name]
			.filter(Boolean)
			.map((value) => value!.toLowerCase());

		if (values.some((v) => v === 'production' || v.includes('default branch'))) return true;

		const branches = trigger.branch_includes ?? [];
		return branches.includes('main') || branches.includes('master');
	}

	// --- Deploy hooks (HTTPS POST to Cloudflare-issued URL; allowlisted in Directus)

	/**
	 * Deploy hooks are triggered with an unauthenticated HTTPS POST to the hook URL Cloudflare issued.
	 * We only POST to URLs that are allowlisted in Directus for this worker (see assertDeployHookInProjectAllowlist).
	 */
	private async requestDeployHook(hookUrl: string): Promise<CloudflareBuild> {
		let parsed: URL;

		try {
			parsed = new URL(hookUrl.trim());
		} catch {
			throw new InvalidPayloadError({ reason: 'deploy_hook_url must be a valid URL' });
		}

		if (parsed.protocol !== 'https:') {
			throw new InvalidPayloadError({ reason: 'deploy_hook_url must use HTTPS' });
		}

		const origin = `${parsed.protocol}//${parsed.host}`;
		const pathWithQuery = `${parsed.pathname}${parsed.search}` || '/';

		const response = await this.axiosRequest<CloudflareApiResponse<CloudflareBuild>>(origin, pathWithQuery, {
			method: 'POST',
		});

		if (response.status >= 400) {
			throw new ServiceUnavailableError({
				service: 'cloudflare',
				reason: this.getErrorMessage(response.data ?? {}, `Deploy hook error: ${response.status}`),
			});
		}

		return (response.data?.result ?? {}) as CloudflareBuild;
	}

	private normalizeDeployHookUrlForCompare(raw: string): string {
		return new URL(raw.trim()).href;
	}

	/**
	 * Ensures hook deploys only use URLs saved for this worker in Directus (same list as the app menu).
	 */
	private assertDeployHookInProjectAllowlist(projectExternalId: string, deployHookUrl: string): void {
		const map = this.options.deploy_hooks_by_project;

		if (!map || typeof map !== 'object') {
			throw new InvalidPayloadError({
				reason:
					'No deploy hooks are configured for this deployment. Add them under Settings → Deployments → Cloudflare.',
			});
		}

		const hooks = map[projectExternalId];

		if (!Array.isArray(hooks) || hooks.length === 0) {
			throw new InvalidPayloadError({
				reason:
					'No deploy hooks are configured for this worker. Add hooks under deployment settings or use “Deploy” for the default Workers Builds trigger.',
			});
		}

		let requested: string;

		try {
			requested = this.normalizeDeployHookUrlForCompare(deployHookUrl);
		} catch {
			throw new InvalidPayloadError({ reason: 'deploy_hook_url must be a valid HTTPS URL' });
		}

		const allowed = hooks.some((entry) => {
			if (!entry || typeof entry.url !== 'string' || entry.url.trim() === '') return false;

			try {
				return this.normalizeDeployHookUrlForCompare(entry.url) === requested;
			} catch {
				return false;
			}
		});

		if (!allowed) {
			throw new InvalidPayloadError({
				reason:
					'This deploy hook URL is not among the hooks saved for this project in Directus. Refresh the page or update deployment settings.',
			});
		}
	}

	async testConnection(): Promise<void> {
		await this.request<CloudflareWorker[]>(`accounts/${this.accountId}/workers/scripts`);
	}

	async listProjects(): Promise<Project[]> {
		const result = await this.request<CloudflareWorker[] | { scripts?: CloudflareWorker[] }>(
			`accounts/${this.accountId}/workers/scripts`,
		);

		const workers = Array.isArray(result) ? result : (result.scripts ?? []);

		const mappedWorkers = workers
			.map((worker) => this.mapProject(worker))
			.filter((project) => project.id && project.name);

		const deployableByTag = new Map<string, boolean>();

		await Promise.all(
			mappedWorkers.map(async (worker) => {
				deployableByTag.set(worker.id, await this.hasBuildTrigger(worker.id));
			}),
		);

		return mappedWorkers.map((worker) => ({ ...worker, deployable: deployableByTag.get(worker.id) ?? false }));
	}

	async getProject(projectId: string): Promise<Project> {
		const projects = await this.listProjects();
		const project = projects.find((item) => item.id === projectId);

		if (!project) {
			throw new ServiceUnavailableError({
				service: 'cloudflare',
				reason: `Cloudflare Worker "${projectId}" not found`,
			});
		}

		return project;
	}

	async listDeployments(projectId: string, limit = 20): Promise<Deployment[]> {
		const result = await this.request<CloudflareBuild[] | { builds?: CloudflareBuild[] }>(
			`accounts/${this.accountId}/builds/workers/${encodeURIComponent(projectId)}/builds`,
			{ params: { per_page: String(limit) } },
		);

		const builds = Array.isArray(result) ? result : (result.builds ?? []);
		return builds.map((build) => this.mapBuild(build)).filter((build) => build.id);
	}

	async getDeployment(deploymentId: string): Promise<Details> {
		const [build, logsPayload] = await Promise.all([
			this.request<CloudflareBuild>(`accounts/${this.accountId}/builds/builds/${encodeURIComponent(deploymentId)}`),
			this.request<CloudflareBuildLogsResponse>(
				`accounts/${this.accountId}/builds/builds/${encodeURIComponent(deploymentId)}/logs`,
			),
		]);

		return {
			...this.mapBuild({ ...build, id: this.getBuildId(build) || deploymentId }),
			logs: this.extractLogs(logsPayload),
		};
	}

	async triggerDeployment(
		projectId: string,
		options?: { preview?: boolean; clearCache?: boolean; deployHookUrl?: string },
	): Promise<TriggerResult> {
		if (options?.deployHookUrl) {
			this.assertDeployHookInProjectAllowlist(projectId, options.deployHookUrl);
			const response = await this.requestDeployHook(options.deployHookUrl);

			return {
				deployment_id: this.getBuildId(response),
				status: this.mapStatus(response.status, response.build_outcome),
				created_at: new Date(response.created_at ?? response.created_on ?? new Date().toISOString()),
				...(response.url ? { url: response.url } : {}),
			};
		}

		const triggers = await this.listTriggers(projectId);
		const trigger = triggers.find((entry) => this.isProductionTrigger(entry)) ?? triggers[0];
		const triggerUuid = this.getTriggerUuid(trigger);
		const branch = this.getTriggerBranch(trigger);

		if (!triggerUuid) {
			throw new InvalidProviderConfigError({
				provider: 'cloudflare',
				reason: 'This Worker has no build trigger configured — configure Workers Builds in Cloudflare first',
			});
		}

		if (!branch) {
			throw new InvalidProviderConfigError({
				provider: 'cloudflare',
				reason:
					'Cloudflare trigger branch could not be determined. Configure a branch-based trigger in Workers Builds.',
			});
		}

		const response = await this.request<CloudflareBuild>(
			`accounts/${this.accountId}/builds/triggers/${encodeURIComponent(triggerUuid)}/builds`,
			{
				method: 'POST',
				body: JSON.stringify({ branch }),
			},
		);

		return {
			deployment_id: this.getBuildId(response),
			status: this.mapStatus(response.status, response.build_outcome),
			created_at: new Date(response.created_at ?? response.created_on ?? new Date().toISOString()),
			...(response.url ? { url: response.url } : {}),
		};
	}

	async cancelDeployment(deploymentId: string): Promise<Status> {
		const response = await this.request<CloudflareBuild>(
			`accounts/${this.accountId}/builds/builds/${encodeURIComponent(deploymentId)}/cancel`,
			{ method: 'PUT' },
		);

		return this.mapStatus(response.status ?? 'cancelled');
	}

	async getDeploymentLogs(deploymentId: string, options?: { since?: Date }): Promise<Log[]> {
		const logsPayload = await this.request<CloudflareBuildLogsResponse>(
			`accounts/${this.accountId}/builds/builds/${encodeURIComponent(deploymentId)}/logs`,
		);

		const logs = this.extractLogs(logsPayload);

		if (options?.since) {
			return logs.filter((log) => log.timestamp >= options.since!);
		}

		return logs;
	}

	async registerWebhook(_webhookUrl: string, projectIds: string[]): Promise<WebhookRegistrationResult> {
		const projectId = projectIds[0];

		if (!projectId) {
			return { webhook_ids: [], webhook_secret: '' };
		}

		const triggers = await this.listTriggers(projectId);
		const trigger = triggers.find((entry) => this.isProductionTrigger(entry)) ?? triggers[0];
		const triggerUuid = this.getTriggerUuid(trigger);

		if (!triggerUuid) {
			throw new InvalidProviderConfigError({
				provider: 'cloudflare',
				reason: 'This Worker has no build trigger configured — configure Workers Builds in Cloudflare first',
			});
		}

		return {
			webhook_ids: [triggerUuid],
			webhook_secret: '',
		};
	}

	async unregisterWebhook(_webhookIds: string[]): Promise<void> {
		// Cloudflare trigger lifecycle is managed by the customer in Cloudflare.
	}

	verifyAndParseWebhook(
		_rawBody: Buffer,
		_headers: Record<string, string | string[] | undefined>,
		_webhookSecret: string,
	): DeploymentWebhookEvent | null {
		return null;
	}
}
