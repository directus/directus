import { AI_ALLOWED_MIME_TYPES, AI_MAX_FILE_SIZE, isProviderType, type ProviderType } from '@directus/ai';
import { useEnv } from '@directus/env';
import { InvalidPayloadError, isDirectusError, ServiceUnavailableError } from '@directus/errors';
import type { Accountability, SchemaOverview } from '@directus/types';
import { toBoolean } from '@directus/utils';
import { AISDKError, APICallError, RetryError } from 'ai';
import type { Knex } from 'knex';
import { useLogger } from '../../logger/index.js';
import type { AssetsService } from '../../services/assets.js';
import { getAccountabilityForRole } from '../../utils/get-accountability-for-role.js';

/** `AI_ENABLED=false` turns off all AI features. The `/ai` routes aren't mounted, and flow steps refuse to run. */
export function assertAIEnabled(): void {
	if (toBoolean(useEnv()['AI_ENABLED']) !== true) {
		throw new ServiceUnavailableError({
			service: 'ai',
			reason: 'AI is turned off on this server (AI_ENABLED is false)',
		});
	}
}

/** Model ids can come from flow data, and some providers put them in the request URL. */
const MODEL_ID = /^[\w.\-:/@]+$/;

/** Splits `provider:model-id`. Model ids may contain colons. */
export function parseModelKey(key: string | null | undefined): { provider: ProviderType; model: string } {
	const [provider, ...rest] = (key ?? '').split(':');
	const model = rest.join(':');

	if (!isProviderType(provider) || !model) {
		throw new InvalidPayloadError({ reason: `"model" must look like "provider:model-id"` });
	}

	if (!MODEL_ID.test(model) || model.includes('..')) {
		throw new InvalidPayloadError({ reason: `"${model}" isn't a valid model id` });
	}

	return { provider, model };
}

/** The prompt after flow data is filled in. A missing value from the data chain is an empty prompt, not `""`. */
export function readPrompt(prompt: unknown): string {
	let text = '';

	if (typeof prompt === 'string') text = prompt;
	else if (prompt !== null && prompt !== undefined) text = JSON.stringify(prompt);

	if (!text.trim()) {
		throw new InvalidPayloadError({ reason: `"prompt" is required` });
	}

	return text;
}

/**
 * Turns AI SDK errors into ones Directus writes. Flows keep a failed step's error as its data, and can return it to a
 * webhook caller. SDK errors hold the whole request, and their messages can quote the request, the reply, or
 * credentials a provider echoed back, so none of that text is kept or logged.
 */
export function toOperationError(error: unknown, provider: ProviderType): unknown {
	if (isDirectusError(error) || !AISDKError.isInstance(error)) return error;

	const cause = RetryError.isInstance(error) && AISDKError.isInstance(error.lastError) ? error.lastError : error;
	const status = APICallError.isInstance(cause) ? cause.statusCode : undefined;

	useLogger().warn({ provider, error: cause.name, status }, 'AI provider request failed');

	if (status === 401 || status === 403) {
		return new ServiceUnavailableError({ service: provider, reason: 'The provider refused the API key' });
	}

	if (status === 402) {
		return new ServiceUnavailableError({ service: provider, reason: 'The provider account is out of credits' });
	}

	if (status === 429) {
		return new ServiceUnavailableError({
			service: provider,
			reason: 'The provider is limiting requests. Try again later',
		});
	}

	if (status && status < 500) {
		return new InvalidPayloadError({ reason: `The provider rejected the request (HTTP ${status})` });
	}

	if (status || APICallError.isInstance(cause) || RetryError.isInstance(cause)) {
		return new ServiceUnavailableError({
			service: provider,
			reason: status ? `The provider failed (HTTP ${status})` : `The provider couldn't be reached`,
		});
	}

	return new InvalidPayloadError({ reason: `The AI request failed (${cause.name})` });
}

/** Accepts ids, comma-separated ids, or file objects, as they come out of the data chain. Repeated ids count once. */
export function getFileIds(value: unknown): string[] {
	const values: unknown[] = typeof value === 'string' ? value.split(',') : [value].flat();

	const ids = values
		.map((item) => (item && typeof item === 'object' ? (item as { id?: unknown }).id : item))
		.filter((id): id is string | number => typeof id === 'string' || typeof id === 'number')
		.map((id) => String(id).trim())
		.filter(Boolean);

	return [...new Set(ids)];
}

/** Same `permissions` option as the item operations: $trigger, $public, $full, or a role id. */
export async function getOperationAccountability(
	permissions: string | undefined,
	context: { accountability: Accountability | null; database: Knex; schema: SchemaOverview },
): Promise<Accountability | null> {
	const { accountability } = context;

	if (!permissions || permissions === '$trigger') return accountability;
	if (permissions === '$full') return getAccountabilityForRole('system', context);
	if (permissions === '$public') return getAccountabilityForRole(null, context);
	return getAccountabilityForRole(permissions, context);
}

/** Ids can come from flow data, so the number of reads is capped too, not just their size */
const MAX_FILES = 20;

const MAX_SIZE_MB = AI_MAX_FILE_SIZE / (1024 * 1024);

export interface ModelFile {
	data: Buffer;
	mediaType: string;
	filename: string | null;
	width: number | null;
	height: number | null;
}

/** Reads files one at a time, stopping once they add up to more than the AI file size limit. */
export async function readFilesForModel(
	assets: AssetsService,
	ids: string[],
	allowedTypes: readonly string[] = AI_ALLOWED_MIME_TYPES,
): Promise<ModelFile[]> {
	if (ids.length > MAX_FILES) {
		throw new InvalidPayloadError({ reason: `Send at most ${MAX_FILES} files to the model` });
	}

	const files: ModelFile[] = [];
	let remaining = AI_MAX_FILE_SIZE;

	for (const id of ids) {
		const file = await readFileForModel(assets, id, allowedTypes, remaining);
		remaining -= file.data.length;
		files.push(file);
	}

	return files;
}

async function readFileForModel(
	assets: AssetsService,
	id: string,
	allowedTypes: readonly string[],
	limit: number,
): Promise<ModelFile> {
	const { stream, file } = await assets.getAsset(id);

	if (!allowedTypes.includes(file.type)) {
		stream.destroy();
		throw new InvalidPayloadError({ reason: `File "${id}" has type "${file.type}", which isn't supported here` });
	}

	const tooLarge = () =>
		new InvalidPayloadError({ reason: `Files sent to the model can't add up to more than ${MAX_SIZE_MB}MB` });

	if (Number(file.filesize) > limit) {
		stream.destroy();
		throw tooLarge();
	}

	const chunks: Buffer[] = [];
	let size = 0;

	// `filesize` can be missing, so count while reading too
	for await (const chunk of stream) {
		size += chunk.length;

		if (size > limit) {
			stream.destroy();
			throw tooLarge();
		}

		chunks.push(Buffer.from(chunk));
	}

	return {
		data: Buffer.concat(chunks),
		mediaType: file.type,
		filename: file.filename_download ?? null,
		width: file.width ?? null,
		height: file.height ?? null,
	};
}
