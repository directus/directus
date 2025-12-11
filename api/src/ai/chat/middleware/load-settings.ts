import type { RequestHandler } from 'express';
import { SettingsService } from '../../../services/settings.js';
import { getSchema } from '../../../utils/get-schema.js';
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

	const { ai_openai_api_key, ai_anthropic_api_key, ai_system_prompt, ai_mcp_external_servers } =
		await service.readSingleton({
			fields: ['ai_openai_api_key', 'ai_anthropic_api_key', 'ai_system_prompt', 'ai_mcp_external_servers'],
		});

	// Parse MCP external servers if stored as string (some DBs store JSON as string)
	let mcpExternalServers: MCPServerConfig[] = [];

	if (ai_mcp_external_servers) {
		let rawServers: RawMCPServerConfig[] = [];

		if (typeof ai_mcp_external_servers === 'string') {
			try {
				rawServers = JSON.parse(ai_mcp_external_servers);
			} catch {
				// Invalid JSON, ignore
			}
		} else if (Array.isArray(ai_mcp_external_servers)) {
			rawServers = ai_mcp_external_servers;
		}

		// Transform flat auth fields to nested structure
		mcpExternalServers = rawServers.map(transformServerConfig);
	}

	res.locals['ai'] = {
		apiKeys: {
			openai: ai_openai_api_key,
			anthropic: ai_anthropic_api_key,
		},
		systemPrompt: ai_system_prompt,
		mcpExternalServers,
	};

	return next();
};
