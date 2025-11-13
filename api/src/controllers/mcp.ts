import { ForbiddenError } from '@directus/errors';
import { Router } from 'express';
import { DirectusMCP } from '../mcp/index.js';
import { SettingsService } from '../services/settings.js';
import asyncHandler from '../utils/async-handler.js';

const router = Router();

const mcpHandler = asyncHandler(async (req, res) => {
	const settings = new SettingsService({
		schema: req.schema,
	});

	const {
		mcp_enabled,
		mcp_allow_deletes,
		mcp_allow_system_collections,
		mcp_prompts_collection,
		mcp_system_prompt,
		mcp_system_prompt_enabled,
	} = await settings.readSingleton({
		fields: [
			'mcp_enabled',
			'mcp_allow_deletes',
			'mcp_allow_system_collections',
			'mcp_prompts_collection',
			'mcp_system_prompt',
			'mcp_system_prompt_enabled',
		],
	});

	if (!mcp_enabled) {
		throw new ForbiddenError({ reason: 'MCP must be enabled' });
	}

	const mcp = new DirectusMCP({
		promptsCollection: mcp_prompts_collection,
		allowDeletes: mcp_allow_deletes,
		allowSystemCollections: mcp_allow_system_collections,
		systemPromptEnabled: mcp_system_prompt_enabled,
		systemPrompt: mcp_system_prompt,
	});

	mcp.handleRequest(req, res);
});

router.get('/', mcpHandler);

router.post('/', mcpHandler);

export default router;
