import {
	HitRateLimitError,
	InvalidCredentialsError,
	InvalidPayloadError,
	InvalidProviderConfigError,
	ServiceUnavailableError,
} from '@directus/errors';
import type {
	Credentials,
	DeploymentWebhookEvent,
	Details,
	Log,
	Options,
	Project,
	Run,
	Status,
	TriggerResult,
	WebhookRegistrationResult,
} from '@directus/types';
import pLimit from 'p-limit';
import { refreshCloudflareQueueConsumer } from '../../schedules/cloudflare-queue-consumer.js';
import { DeploymentDriver, type DeploymentRequestOptions } from '../deployment.js';

export interface CloudflareCredentials extends Credentials {
	api_token: string;
}

export interface CloudflareOptions extends Options {
	account_id: string;
	/** Keys are worker tags (immutable external IDs). */
	deploy_hooks_by_project?: Record<string, Array<{ name?: string; url?: string }>>;
	/** One shared queue; create a Workers Builds event subscription per worker targeting this queue. */
	events_queue_id?: string;
}

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
	build_uuid?: string;
	status?: string;
	build_outcome?: string;
	created_on?: string;
	stopped_on?: string;
}

type CloudflareBuildLogLine = [number, string];

interface CloudflareBuildLogsResponse {
	cursor?: string;
	truncated?: boolean;
	lines?: CloudflareBuildLogLine[];
	events?: { type: string; started_on?: string; ended_on?: string }[];
}

interface CloudflareTrigger {
	trigger_uuid?: string;
	trigger_name?: string;
	branch_includes?: string[];
}

interface CloudflareWorkersBuildsEvent {
	type?: string;
	source?: {
		type?: string;
		workerName?: string;
	};
	payload?: {
		buildUuid?: string;
		status?: string;
		buildOutcome?: string | null;
		createdAt?: string;
		stoppedAt?: string | null;
		buildTriggerMetadata?: {
			branch?: string;
			buildTriggerSource?: string;
			commitHash?: string;
			commitMessage?: string;
			author?: string;
		};
	};
	metadata?: {
		accountId?: string;
		eventSubscriptionId?: string;
		eventSchemaVersion?: number;
		eventTimestamp?: string;
	};
}

export interface CloudflareQueuePullMessage {
	body: unknown;
	id: string;
	lease_id: string;
	timestamp_ms?: number;
	attempts?: number;
	metadata?: Record<string, string>;
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

	/** Accepts 32-char hex; strips UUID-style separators and whitespace from pasted values. */
	private normalizeAccountId(raw: string): string {
		const trimmed = raw.trim();

		if (!trimmed) {
			throw new InvalidProviderConfigError({
				provider: 'cloudflare-workers',
				reason: 'Missing account_id in deployment options',
			});
		}

		const hexOnly = trimmed.replace(/[^a-f0-9]/gi, '');

		if (/^[a-f0-9]{32}$/i.test(hexOnly)) {
			return hexOnly.toLowerCase();
		}

		throw new InvalidProviderConfigError({
			provider: 'cloudflare-workers',
			reason:
				'Invalid account_id. Use the 32-character Cloudflare Account ID (hex) from the dashboard overview or URL.',
		});
	}

	private get accountId(): string {
		return this.normalizeAccountId(String(this.options.account_id ?? ''));
	}

	private get apiToken(): string {
		const apiToken = this.credentials.api_token?.trim();

		if (!apiToken) {
			throw new InvalidProviderConfigError({
				provider: 'cloudflare-workers',
				reason: 'Missing api_token in deployment credentials',
			});
		}

		return apiToken;
	}

	private getErrorMessage(response: CloudflareApiResponse<unknown>, fallback: string): string {
		return response.errors?.[0]?.message || fallback;
	}

	private async request<T>(endpoint: string, options: DeploymentRequestOptions = {}, retryCount = 0): Promise<T> {
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
			const waitSeconds = Number.isFinite(Number(resetHeader)) ? Number(resetHeader) : 60;

			if (retryCount < 3) {
				await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
				return this.request<T>(endpoint, options, retryCount + 1);
			}

			throw new HitRateLimitError({
				limit: Number(response.headers['x-ratelimit-limit'] ?? 0),
				reset: new Date(Date.now() + waitSeconds * 1000),
			});
		}

		if (response.status >= 400) {
			throw new ServiceUnavailableError({
				service: 'cloudflare-workers',
				reason: this.getErrorMessage(body, `Cloudflare API error: ${response.status}`),
			});
		}

		if (body.success === false) {
			throw new ServiceUnavailableError({
				service: 'cloudflare-workers',
				reason: this.getErrorMessage(body, 'Cloudflare API request failed'),
			});
		}

		return (body.result ?? {}) as T;
	}

	/** Cloudflare uses `stopped` + `build_outcome`; unknown values stay `building`. */
	private mapStatus(cloudflareStatus: string | undefined, buildOutcome?: string | undefined): Status {
		const status = cloudflareStatus?.toLowerCase();
		const outcome = buildOutcome?.toLowerCase();

		if (status === 'stopped') {
			if (outcome === 'success' || outcome === 'dce') return 'ready';
			if (outcome === 'fail' || outcome === 'failed' || outcome === 'failure') return 'error';
			if (outcome === 'canceled' || outcome === 'cancelled') return 'canceled';
			return 'building';
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
		return build.build_uuid ?? '';
	}

	private mapBuild(build: CloudflareBuild): Run {
		const result: Run = {
			id: this.getBuildId(build),
			project_id: '', // build payload has no worker identifier
			status: this.mapStatus(build.status, build.build_outcome),
			created_at: new Date(build.created_on ?? new Date().toISOString()),
		};

		// Workers Builds has no per-build preview URL (unlike Vercel/Netlify deploy objects).
		if (build.stopped_on) result.finished_at = new Date(build.stopped_on);

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

	private mapProject(worker: CloudflareWorker): Project {
		const id = worker.tag ?? worker.id ?? ''; // tag is the stable external ID
		const name = worker.id ?? worker.name ?? worker.tag ?? '';

		return {
			id,
			name,
			deployable: true,
		};
	}

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
		return trigger?.trigger_uuid ?? null;
	}

	private getTriggerBranch(trigger: CloudflareTrigger | undefined): string | null {
		return trigger?.branch_includes?.find((value) => value !== '*') ?? null;
	}

	private isProductionTrigger(trigger: CloudflareTrigger): boolean {
		const name = trigger.trigger_name?.toLowerCase();
		if (name === 'production' || name?.includes('default branch')) return true;

		const branches = trigger.branch_includes ?? [];
		return branches.includes('main') || branches.includes('master');
	}

	/** POST to the hook URL Cloudflare issued; no auth header on their side. */
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
				service: 'cloudflare-workers',
				reason: this.getErrorMessage(response.data ?? {}, `Deploy hook error: ${response.status}`),
			});
		}

		return (response.data?.result ?? {}) as CloudflareBuild;
	}

	private normalizeDeployHookUrlForCompare(raw: string): string {
		return new URL(raw.trim()).href;
	}

	/** Only URLs saved for this worker in Directus options may be triggered. */
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

	private async fetchMappedWorkers(): Promise<Project[]> {
		const result = await this.request<CloudflareWorker[] | { scripts?: CloudflareWorker[] }>(
			`accounts/${this.accountId}/workers/scripts`,
		);

		const workers = Array.isArray(result) ? result : (result.scripts ?? []);

		return workers.map((worker) => this.mapProject(worker)).filter((project) => project.id && project.name);
	}

	async listProjects(): Promise<Project[]> {
		const mappedWorkers = await this.fetchMappedWorkers();

		return Promise.all(
			mappedWorkers.map(async (worker) => ({ ...worker, deployable: await this.hasBuildTrigger(worker.id) })),
		);
	}

	async getProject(projectId: string): Promise<Project> {
		// List all workers once — avoids N trigger lookups when resolving a single project.
		const mappedWorkers = await this.fetchMappedWorkers();
		const worker = mappedWorkers.find((project) => project.id === projectId);

		if (!worker) {
			throw new ServiceUnavailableError({
				service: 'cloudflare-workers',
				reason: `Cloudflare Worker "${projectId}" not found`,
			});
		}

		return { ...worker, deployable: await this.hasBuildTrigger(worker.id) };
	}

	async getRun(runId: string): Promise<Details> {
		const [build, logsPayload] = await Promise.all([
			this.request<CloudflareBuild>(`accounts/${this.accountId}/builds/builds/${encodeURIComponent(runId)}`),
			this.request<CloudflareBuildLogsResponse>(
				`accounts/${this.accountId}/builds/builds/${encodeURIComponent(runId)}/logs`,
			),
		]);

		const run = this.mapBuild(build);

		return {
			...run,
			id: run.id || runId,
			logs: this.extractLogs(logsPayload),
		};
	}

	private mapTriggerResult(build: CloudflareBuild): TriggerResult {
		return {
			deployment_id: this.getBuildId(build),
			status: this.mapStatus(build.status, build.build_outcome),
			created_at: new Date(build.created_on ?? new Date().toISOString()),
		};
	}

	async triggerRun(
		projectId: string,
		options?: { preview?: boolean; clearCache?: boolean; deployHookUrl?: string },
	): Promise<TriggerResult> {
		if (options?.deployHookUrl) {
			this.assertDeployHookInProjectAllowlist(projectId, options.deployHookUrl);
			const response = await this.requestDeployHook(options.deployHookUrl);

			return this.mapTriggerResult(response);
		}

		const triggers = await this.listTriggers(projectId);
		const trigger = triggers.find((entry) => this.isProductionTrigger(entry)) ?? triggers[0];
		const triggerUuid = this.getTriggerUuid(trigger);
		const branch = this.getTriggerBranch(trigger);

		if (!triggerUuid) {
			throw new InvalidProviderConfigError({
				provider: 'cloudflare-workers',
				reason: 'This Worker has no build trigger configured — configure Workers Builds in Cloudflare first',
			});
		}

		if (!branch) {
			throw new InvalidProviderConfigError({
				provider: 'cloudflare-workers',
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

		return this.mapTriggerResult(response);
	}

	async cancelRun(runId: string): Promise<Status> {
		try {
			const response = await this.request<CloudflareBuild>(
				`accounts/${this.accountId}/builds/builds/${encodeURIComponent(runId)}/cancel`,
				{ method: 'PUT' },
			);

			return this.mapStatus(response.status ?? 'cancelled', response.build_outcome ?? 'canceled');
		} catch {
			const details = await this.getRun(runId);

			if (details.status !== 'building') {
				return details.status;
			}

			throw new ServiceUnavailableError({
				service: 'cloudflare-workers',
				reason: `Could not cancel the run: ${runId}`,
			});
		}
	}

	async getRunLogs(runId: string, options?: { since?: Date }): Promise<Log[]> {
		const logsPayload = await this.request<CloudflareBuildLogsResponse>(
			`accounts/${this.accountId}/builds/builds/${encodeURIComponent(runId)}/logs`,
		);

		const logs = this.extractLogs(logsPayload);

		if (options?.since) {
			return logs.filter((log) => log.timestamp >= options.since!);
		}

		return logs;
	}

	/** No-op — Workers Builds has no outbound webhooks; status comes from polling or queue pull. */
	async registerWebhook(_webhookUrl: string, _projectIds: string[]): Promise<WebhookRegistrationResult> {
		return { webhook_ids: [], webhook_secret: '' };
	}

	async unregisterWebhook(_webhookIds: string[]): Promise<void> {}

	verifyAndParseWebhook(
		_rawBody: Buffer,
		_headers: Record<string, string | string[] | undefined>,
		_webhookSecret: string,
	): DeploymentWebhookEvent | null {
		return null;
	}

	override async onConfigCreated(): Promise<void> {
		await refreshCloudflareQueueConsumer();
	}

	override async onConfigUpdated(): Promise<void> {
		await refreshCloudflareQueueConsumer();
	}

	override async onConfigDeleted(): Promise<void> {
		await refreshCloudflareQueueConsumer();
	}

	/** Pull Workers Builds subscription events via Cloudflare Queues HTTP API. */
	async pullQueueMessages(options?: {
		batch_size?: number;
		visibility_timeout_ms?: number;
	}): Promise<CloudflareQueuePullMessage[]> {
		const queueId = this.options.events_queue_id?.trim();
		if (!queueId) return [];

		const result = await this.request<{ messages?: CloudflareQueuePullMessage[] }>(
			`accounts/${this.accountId}/queues/${encodeURIComponent(queueId)}/messages/pull`,
			{
				method: 'POST',
				body: JSON.stringify({
					batch_size: Math.min(100, Math.max(1, options?.batch_size ?? 50)),
					visibility_timeout_ms: options?.visibility_timeout_ms ?? 60_000,
				}),
			},
		);

		return Array.isArray(result.messages) ? result.messages : [];
	}

	/** Ack processed messages and retry failures so they are not redelivered after the lease expires. */
	async ackQueueMessages(ackLeaseIds: string[], retryLeaseIds: string[]): Promise<void> {
		const queueId = this.options.events_queue_id?.trim();
		if (!queueId) return;

		if (ackLeaseIds.length === 0 && retryLeaseIds.length === 0) return;

		await this.request<unknown>(`accounts/${this.accountId}/queues/${encodeURIComponent(queueId)}/messages/ack`, {
			method: 'POST',
			body: JSON.stringify({
				acks: ackLeaseIds.map((lease_id) => ({ lease_id })),
				retries: retryLeaseIds.map((lease_id) => ({ lease_id })),
			}),
		});
	}

	private decodeQueueMessageBody(message: CloudflareQueuePullMessage): unknown {
		const body = message.body;
		const contentType = message.metadata?.['CF-Content-Type']?.toLowerCase();

		if (body !== null && typeof body === 'object') {
			return body;
		}

		if (typeof body !== 'string') {
			return body;
		}

		// Queues may deliver JSON as base64 when CF-Content-Type is json or bytes.
		if (contentType === 'json' || contentType === 'bytes') {
			try {
				const decoded = Buffer.from(body, 'base64').toString('utf8');
				return JSON.parse(decoded) as unknown;
			} catch {
				return body;
			}
		}

		try {
			return JSON.parse(body) as unknown;
		} catch {
			return body;
		}
	}

	parseQueueMessage(message: CloudflareQueuePullMessage): DeploymentWebhookEvent | null {
		return this.parseQueueEvent(this.decodeQueueMessageBody(message));
	}

	/** Map Workers Builds queue subscription payloads into deployment webhook events. */
	parseQueueEvent(rawEvent: unknown): DeploymentWebhookEvent | null {
		let parsedBody: unknown;

		try {
			const wrapped = rawEvent as { body?: unknown; payload?: unknown } | undefined;
			const hasTopLevelType = typeof (rawEvent as { type?: unknown } | undefined)?.type === 'string';
			const body = hasTopLevelType ? rawEvent : (wrapped?.body ?? wrapped?.payload ?? rawEvent);
			parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
		} catch {
			return null;
		}

		const event = parsedBody as CloudflareWorkersBuildsEvent;

		const eventType = event?.type?.toLowerCase();
		const workerName = event?.source?.workerName;
		const buildUuid = event?.payload?.buildUuid;

		if (!eventType || !workerName || !buildUuid) return null;

		// Event types are matched lowercased (`cf.workersBuilds.worker.build.*`).
		const eventTypeMap: Record<
			string,
			'deployment.created' | 'deployment.succeeded' | 'deployment.error' | 'deployment.canceled'
		> = {
			'cf.workersbuilds.worker.build.started': 'deployment.created',
			'cf.workersbuilds.worker.build.succeeded': 'deployment.succeeded',
			'cf.workersbuilds.worker.build.failed': 'deployment.error',
			'cf.workersbuilds.worker.build.canceled': 'deployment.canceled',
		};

		const mappedType = eventTypeMap[eventType];
		if (!mappedType) return null;

		const timestamp =
			event.metadata?.eventTimestamp ??
			event.payload?.stoppedAt ??
			event.payload?.createdAt ??
			new Date().toISOString();

		const branch = event.payload?.buildTriggerMetadata?.branch;

		return {
			type: mappedType,
			provider: 'cloudflare-workers',
			project_external_id: workerName,
			deployment_external_id: buildUuid,
			status: this.mapStatus(event.payload?.status, event.payload?.buildOutcome ?? undefined),
			...(branch ? { target: branch } : {}),
			timestamp: new Date(timestamp),
			raw: (parsedBody ?? {}) as Record<string, any>,
		};
	}
}
