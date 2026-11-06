import type { ProviderType } from '@directus/ai';
import { InvalidPayloadError } from '@directus/errors';
import { defineOperationApi } from '@directus/extensions';
import { optionToObject } from '@directus/utils';
import {
	type FilePart,
	generateText,
	jsonSchema,
	type JSONSchema7,
	NoObjectGeneratedError,
	Output,
	type Schema,
	type TextPart,
} from 'ai';
import { z } from 'zod';
import { addAdditionalPropertiesToJsonSchema } from '../../ai/chat/utils/add-additional-properties-to-json-schema.js';
import {
	getFileIds,
	getOperationAccountability,
	type ModelFile,
	parseModelKey,
	readFilesForModel,
	readPrompt,
	toOperationError,
} from '../../ai/flow-operations/utils.js';
import { getAISettings, type ResolvedLanguageModel, resolveLanguageModel } from '../../ai/providers/index.js';
import { getAITelemetryConfig } from '../../ai/telemetry/index.js';
import { AssetsService } from '../../services/assets.js';

type Options = {
	model: string; // `${provider}:${model}`
	system?: string | null;
	prompt: unknown;
	files?: unknown; // file ids, comma-separated ids, or file objects
	output?: 'text' | 'object';
	schema?: Record<string, unknown> | string | null; // JSON Schema for object output
	maxOutputTokens?: number | null;
	permissions?: string; // $public, $trigger, $full, or UUID of a role
};

export default defineOperationApi<Options>({
	id: 'ai-text',

	handler: async (options, { accountability, database, getSchema }) => {
		const { provider, model: modelId } = parseModelKey(options.model);

		const prompt = readPrompt(options.prompt);
		const outputSchema = options.output === 'object' ? toValidatedSchema(getOutputSchema(options)) : null;

		const schema = await getSchema({ database });
		const settings = await getAISettings({ knex: database, schema });
		const { model, providerOptions } = resolveLanguageModel(provider, modelId, settings);

		const fileIds = getFileIds(options.files);
		const content: Array<TextPart | FilePart> = [{ type: 'text', text: prompt }];

		if (fileIds.length > 0) {
			const fileAccountability = await getOperationAccountability(options.permissions, {
				accountability,
				database,
				schema,
			});

			const assets = new AssetsService({ schema, accountability: fileAccountability, knex: database });

			const files = await readFilesForModel(assets, fileIds);
			content.push(...files.map(toContentPart));
		}

		const maxOutputTokens = Number(options.maxOutputTokens);
		const hasTokenLimit = Number.isInteger(maxOutputTokens) && maxOutputTokens > 0;

		const telemetry = getAITelemetryConfig(
			{ provider, model: modelId, userId: accountability?.user, role: accountability?.role },
			'directus-ai-text-operation',
		);

		const result = await generateText({
			model,
			...providerOptionsFor(provider, providerOptions, !!outputSchema),
			...(options.system ? { system: options.system } : {}),
			messages: [{ role: 'user', content }],
			...(hasTokenLimit ? { maxOutputTokens } : {}),
			...(outputSchema ? { output: Output.object({ schema: outputSchema }) } : {}),
			...(telemetry ? { experimental_telemetry: telemetry } : {}),
		}).catch((error) => {
			if (NoObjectGeneratedError.isInstance(error)) {
				if (error.finishReason === 'length') throwTokenLimit(hasTokenLimit);
				if (!error.text?.trim()) throwEmptyReply(error.finishReason ?? 'unknown');

				throw new InvalidPayloadError({ reason: `The reply didn't match the output schema${describeIssues(error)}` });
			}

			throw toOperationError(error, provider);
		});

		// Reasoning counts against the token limit, so a low limit can end the reply before it starts
		if (!result.text.trim()) {
			if (result.finishReason === 'length') throwTokenLimit(hasTokenLimit);
			throwEmptyReply(result.finishReason);
		}

		let output: unknown;

		// The SDK only reads the object when the reply finished normally, otherwise `output` throws
		if (outputSchema) {
			try {
				output = result.output;
			} catch {
				throw new InvalidPayloadError({
					reason: `The model returned no object (finish reason "${result.finishReason}")`,
				});
			}
		}

		return {
			...(outputSchema ? { output } : { text: result.text }),
			model: options.model,
			usage: {
				inputTokens: result.usage.inputTokens,
				outputTokens: result.usage.outputTokens,
				totalTokens: result.usage.totalTokens,
			},
			finishReason: result.finishReason,
			warnings: result.warnings ?? [],
		};
	},
});

function getOutputSchema(options: Options): JSONSchema7 {
	let schema: unknown;

	try {
		schema = options.schema ? optionToObject(options.schema) : null;
	} catch {
		throw new InvalidPayloadError({ reason: `"schema" isn't valid JSON` });
	}

	if (!schema || typeof schema !== 'object' || (schema as JSONSchema7).type !== 'object') {
		throw new InvalidPayloadError({ reason: `"schema" must be a JSON Schema for an object` });
	}

	if (Object.keys((schema as JSONSchema7).properties ?? {}).length === 0) {
		throw new InvalidPayloadError({ reason: `Add at least one output field` });
	}

	return requireEveryKey(addAdditionalPropertiesToJsonSchema(schema as JSONSchema7));
}

/**
 * OpenAI's strict mode needs every key listed in `required`. Keys that were optional become nullable instead, the same
 * way the field editor writes them.
 */
function requireEveryKey(schema: JSONSchema7): JSONSchema7 {
	const properties = isSchema(schema.properties) ? schema.properties : null;
	const required = Array.isArray(schema.required) ? schema.required : [];

	if (properties) {
		schema.properties = Object.fromEntries(
			Object.entries(properties).map(([key, value]) => {
				// JSON parsing keeps it as a key, but Zod and the SDK drop it from replies
				if (key === '__proto__') {
					throw new InvalidPayloadError({ reason: `"__proto__" can't be an output field name` });
				}

				if (!isSchema(value)) return [key, value];

				const property = requireEveryKey(value);
				return [
					key,
					required.includes(key) || allowsNull(property) ? property : { anyOf: [property, { type: 'null' }] },
				];
			}),
		);

		schema.required = Object.keys(properties);
	}

	if (isSchema(schema.items)) schema.items = requireEveryKey(schema.items);

	for (const key of ['anyOf', 'allOf', 'oneOf'] as const) {
		const entries = schema[key];
		if (Array.isArray(entries))
			schema[key] = entries.map((entry) => (isSchema(entry) ? requireEveryKey(entry) : entry));
	}

	const definitions = schema as Record<string, unknown>;

	for (const key of ['$defs', 'definitions']) {
		const entries = definitions[key];
		if (isSchema(entries))
			definitions[key] = mapValues(entries, (entry) => (isSchema(entry) ? requireEveryKey(entry) : entry));
	}

	return schema;
}

function isSchema(value: unknown): value is JSONSchema7 {
	return !!value && typeof value === 'object' && !Array.isArray(value);
}

function allowsNull(schema: JSONSchema7): boolean {
	const { type, anyOf } = schema;
	return (
		type === 'null' ||
		(Array.isArray(type) && type.includes('null')) ||
		!!anyOf?.some((entry) => isSchema(entry) && entry.type === 'null')
	);
}

/**
 * The Anthropic SDK only uses native structured output for Claude models it knows. For newer ones it forces a tool call,
 * which models with adaptive thinking reject. Every current Claude model supports the native format.
 */
function providerOptionsFor(
	provider: ProviderType,
	providerOptions: ResolvedLanguageModel['providerOptions'],
	structured: boolean,
): { providerOptions?: ResolvedLanguageModel['providerOptions'] } {
	if (!structured || provider !== 'anthropic') return providerOptions ? { providerOptions } : {};

	const anthropic = providerOptions && 'anthropic' in providerOptions ? providerOptions['anthropic'] : {};

	return {
		providerOptions: { ...providerOptions, anthropic: { ...anthropic, structuredOutputMode: 'outputFormat' } },
	};
}

function throwEmptyReply(finishReason: string): never {
	throw new InvalidPayloadError({ reason: `The model returned an empty reply (finish reason "${finishReason}")` });
}

/** Which fields were wrong, from Zod's issues. Leaves out the values, since they come from the reply. */
function describeIssues(error: NoObjectGeneratedError): string {
	const issues = (error.cause as { cause?: { issues?: unknown } } | undefined)?.cause?.issues;
	if (!Array.isArray(issues) || issues.length === 0) return '';

	// Zod's own messages can quote the reply, like the name of an extra key, so only the code is used. Paths are safe:
	// every object has `additionalProperties: false`, so they're made of schema keys.
	const lines = issues.slice(0, 5).map((issue: { path?: PropertyKey[]; code?: string }) => {
		const problem = ISSUE_TEXT[issue.code ?? ''] ?? 'invalid';
		return `${issue.path?.join('.') || 'reply'}: ${problem}`;
	});

	return ` (${lines.join('; ')})`;
}

const ISSUE_TEXT: Record<string, string> = {
	invalid_type: 'wrong type',
	invalid_value: 'not an allowed value',
	invalid_format: 'wrong format',
	too_small: 'too small or too short',
	too_big: 'too big or too long',
	unrecognized_keys: 'has fields the schema does not list',
	invalid_union: 'matches none of the allowed shapes',
};

/** Says what to change when the reply was cut off by the token limit. */
function throwTokenLimit(hasTokenLimit: boolean): never {
	throw new InvalidPayloadError({
		reason: hasTokenLimit
			? 'The model used all its output tokens before finishing. Raise "Max Output Tokens", or leave it empty'
			: `The reply was longer than the model's output limit. Ask for less, or use a model with a larger limit`,
	});
}

/** Most providers can read text files only as text, not as file attachments. */
function toContentPart(file: ModelFile): TextPart | FilePart {
	if (file.mediaType === 'text/plain') {
		return { type: 'text', text: `${file.filename ?? 'File'}:\n${file.data.toString('utf8')}` };
	}

	return {
		type: 'file',
		data: file.data,
		mediaType: file.mediaType,
		...(file.filename ? { filename: file.filename } : {}),
	};
}

/**
 * Checks the model's reply against the schema, so later steps get the shape they were promised. Some providers
 * treat the schema as a hint. Fails before the model call on schemas Zod can't read, like draft-07 `definitions`.
 */
function toValidatedSchema(schema: JSONSchema7): Schema<unknown> {
	let validator: z.ZodType;

	try {
		validator = z.fromJSONSchema(forLocalCheck(schema) as Parameters<typeof z.fromJSONSchema>[0]);
	} catch (error) {
		const detail = error instanceof Error ? ` (${error.message.slice(0, 200)})` : '';

		throw new InvalidPayloadError({
			reason: `Replies can't be checked against this schema${detail}. Put definitions in $defs, or inline`,
		});
	}

	return jsonSchema(schema, {
		validate: (value) => {
			const result = validator.safeParse(value);
			return result.success ? { success: true, value: result.data } : { success: false, error: result.error };
		},
	});
}

/** Keys whose values are data, not schemas. */
const DATA_KEYS = new Set(['enum', 'const', 'examples']);

/** Keys whose values map names to schemas, so the names themselves are left alone. */
const SCHEMA_MAPS = new Set(['properties', '$defs', 'definitions', 'dependentSchemas']);

/**
 * The copy Zod checks against. Regex patterns are dropped: a pattern runs on the model's reply, which flow data can
 * steer, and a slow pattern blocks the whole API. The provider still gets them. Without `patternProperties`, the keys
 * they allowed would count as extra, so `additionalProperties` goes too. `default` is dropped because Zod fills in a
 * missing key with it, even one that's required or outside the allowed values.
 */
function forLocalCheck(node: unknown): unknown {
	if (Array.isArray(node)) return node.map(forLocalCheck);
	if (!node || typeof node !== 'object') return node;

	const dropped = new Set(['pattern', 'patternProperties', 'default']);
	if ('patternProperties' in node) dropped.add('additionalProperties');

	return Object.fromEntries(
		Object.entries(node)
			.filter(([key]) => !dropped.has(key))
			.map(([key, value]) => {
				if (DATA_KEYS.has(key)) return [key, value];
				if (SCHEMA_MAPS.has(key) && value && typeof value === 'object') return [key, mapValues(value, forLocalCheck)];
				return [key, forLocalCheck(value)];
			}),
	);
}

function mapValues(object: object, fn: (value: unknown) => unknown): Record<string, unknown> {
	return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, fn(value)]));
}
