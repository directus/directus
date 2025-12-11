import type { RequestHandler } from 'express';
import { SettingsService } from '../../../services/settings.js';
import { getSchema } from '../../../utils/get-schema.js';
import type { AISettings } from '../../providers/types.js';
import type { MCPServerConfig } from '../../mcp/client/index.js';

/**
 * Raw server config from settings (flat structure)
 */
interface RawMCPServerConfig {
	id: string;
	name: string;
	url: string;
	enabled: boolean;
	toolApproval: 'always' | 'ask' | 'disabled';
	authType?: 'none' | 'bearer' | 'basic';
	authToken?: string;
	authUsername?: string;
	authPassword?: string;
}

/**
 * Transform raw flat auth fields into nested auth object
 */
function transformServerConfig(raw: RawMCPServerConfig): MCPServerConfig {
	const config: MCPServerConfig = {
		id: raw.id,
		name: raw.name,
		url: raw.url,
		enabled: raw.enabled,
		toolApproval: raw.toolApproval,
	};

	if (raw.authType === 'bearer' && raw.authToken) {
		config.auth = {
			type: 'bearer',
			token: raw.authToken,
		};
	} else if (raw.authType === 'basic' && raw.authUsername && raw.authPassword) {
		config.auth = {
			type: 'basic',
			username: raw.authUsername,
			password: raw.authPassword,
		};
	}

	return config;
}

export const loadSettings: RequestHandler = async (_req, res, next) => {
	const service = new SettingsService({
		schema: await getSchema(),
	});

	const settings = await service.readSingleton({
		fields: [
			'ai_openai_api_key',
			'ai_anthropic_api_key',
			'ai_google_api_key',
			'ai_openai_compatible_api_key',
			'ai_openai_compatible_base_url',
			'ai_openai_compatible_name',
			'ai_openai_compatible_models',
			'ai_openai_compatible_headers',
			'ai_openai_allowed_models',
			'ai_anthropic_allowed_models',
			'ai_google_allowed_models',
			'ai_system_prompt',
			'ai_mcp_external_servers',
		],
	});

	// Parse MCP external servers if stored as string (some DBs store JSON as string)
	let mcpExternalServers: MCPServerConfig[] = [];

	if (settings['ai_mcp_external_servers']) {
		let rawServers: RawMCPServerConfig[] = [];

		if (typeof settings['ai_mcp_external_servers'] === 'string') {
			try {
				rawServers = JSON.parse(settings['ai_mcp_external_servers']);
			} catch {
				// Invalid JSON, ignore
			}
		} else if (Array.isArray(settings['ai_mcp_external_servers'])) {
			rawServers = settings['ai_mcp_external_servers'];
		}

		// Transform flat auth fields to nested structure
		mcpExternalServers = rawServers.map(transformServerConfig);
	}

	const aiSettings: AISettings = {
		openaiApiKey: settings['ai_openai_api_key'] ?? null,
		anthropicApiKey: settings['ai_anthropic_api_key'] ?? null,
		googleApiKey: settings['ai_google_api_key'] ?? null,
		openaiCompatibleApiKey: settings['ai_openai_compatible_api_key'] ?? null,
		openaiCompatibleBaseUrl: settings['ai_openai_compatible_base_url'] ?? null,
		openaiCompatibleName: settings['ai_openai_compatible_name'] ?? null,
		openaiCompatibleModels: settings['ai_openai_compatible_models'] ?? null,
		openaiCompatibleHeaders: settings['ai_openai_compatible_headers'] ?? null,
		openaiAllowedModels: settings['ai_openai_allowed_models'] ?? null,
		anthropicAllowedModels: settings['ai_anthropic_allowed_models'] ?? null,
		googleAllowedModels: settings['ai_google_allowed_models'] ?? null,
		systemPrompt: settings['ai_system_prompt'] ?? null,
	};

	res.locals['ai'] = {
		settings: aiSettings,
		systemPrompt: settings['ai_system_prompt'],
		mcpExternalServers,
	};

	return next();
};
