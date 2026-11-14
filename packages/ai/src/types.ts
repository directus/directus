export const PROVIDER_TYPES = ['openai', 'anthropic', 'google', 'openrouter', 'openai-compatible'] as const;

export type ProviderType = (typeof PROVIDER_TYPES)[number];

export function isProviderType(value: unknown): value is ProviderType {
	return (PROVIDER_TYPES as readonly unknown[]).includes(value);
}

/** Providers whose chat models are limited to a list saved in settings. OpenAI-compatible endpoints aren't checked. */
export type StandardProviderType = Exclude<ProviderType, 'openai-compatible'>;

export type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };

export type ToolApprovalMode = 'always' | 'ask' | 'disabled';

export type SystemTool =
	| 'items'
	| 'files'
	| 'folders'
	| 'assets'
	| 'flows'
	| 'trigger-flow'
	| 'operations'
	| 'schema'
	| 'collections'
	| 'fields'
	| 'relations';

export interface OpenAICompatibleModel {
	id: string;
	name: string;
	context?: number;
	output?: number;
	attachment?: boolean;
	reasoning?: boolean;
	providerOptions?: { [key: string]: JSONValue };
}

export type OpenRouterModel = Omit<OpenAICompatibleModel, 'providerOptions'>;

export interface OpenAICompatibleHeader {
	header: string;
	value: string;
}

export interface ModelDefinition {
	provider: ProviderType;
	model: string;
	name: string;
	limit: {
		context: number;
		output: number;
	};
	cost: {
		input: number;
		output: number;
	};
	/** Supports file attachments */
	attachment: boolean;
	/** Supports reasoning / chain-of-thought */
	reasoning: boolean;
}

/**
 * Anthropic has no image models. OpenAI-compatible is left out: its image adapter only takes pixel sizes, and we don't
 * know which sizes an endpoint supports.
 */
export const IMAGE_PROVIDER_TYPES: readonly ['openai', 'google', 'openrouter'] = [
	'openai',
	'google',
	'openrouter',
] as const satisfies readonly ProviderType[];

export type ImageProviderType = (typeof IMAGE_PROVIDER_TYPES)[number];

export function isImageProviderType(value: unknown): value is ImageProviderType {
	return (IMAGE_PROVIDER_TYPES as readonly unknown[]).includes(value);
}

export type AspectRatio = `${number}:${number}`;

export type ImageSizeSetting = { size: `${number}x${number}` } | { aspectRatio: AspectRatio };

export interface ImageModelDefinition {
	provider: ImageProviderType;
	model: string;
	name: string;
	/** Supported ratios */
	aspectRatios: AspectRatio[];
	/** For models that take a pixel size instead of a ratio, the size to send for each ratio */
	sizes?: Partial<Record<AspectRatio, `${number}x${number}`>>;
	/** Can return a transparent background */
	transparency: boolean;
	/** Images per request. The SDK splits larger counts into parallel requests. Leave out to use the provider's limit. */
	maxImagesPerCall?: number;
}

export type PrimaryKey = string | number;

export interface ItemContextData {
	collection: string;
	key: PrimaryKey;
}

export interface VisualElementContextData {
	key: string;
	collection: string;
	item: PrimaryKey;
	fields?: string[];
	rect?: { top: number; left: number; width: number; height: number };
}

export interface PromptContextData {
	text: string;
	prompt: Record<string, unknown>;
	values: Record<string, string>;
}

export type ContextAttachment =
	| { type: 'item'; data: ItemContextData; display: string; snapshot: Record<string, unknown> }
	| { type: 'visual-element'; data: VisualElementContextData; display: string; snapshot: Record<string, unknown> }
	| { type: 'prompt'; data: PromptContextData; display: string; snapshot: Record<string, unknown> };

/**
 * Providers with a files API that chat attachments are uploaded to. OpenRouter and OpenAI-compatible endpoints have
 * none. Not `satisfies readonly ProviderType[]`: that fails `isolatedDeclarations`.
 */
export const FILE_UPLOAD_PROVIDER_TYPES = ['openai', 'anthropic', 'google'] as const;

export type FileUploadProviderType = (typeof FILE_UPLOAD_PROVIDER_TYPES)[number];

export function isFileUploadProviderType(value: unknown): value is FileUploadProviderType {
	return (FILE_UPLOAD_PROVIDER_TYPES as readonly unknown[]).includes(value);
}

export interface ProviderFileRef {
	provider: FileUploadProviderType;
	fileId: string;
	filename: string;
	mimeType: string;
	sizeBytes: number;
	expiresAt: string | null;
}
