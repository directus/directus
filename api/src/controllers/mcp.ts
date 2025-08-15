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

	const { mcp_enabled, mcp_allow_deletes, mcp_prompts_collection, mcp_system_prompt } = await settings.readSingleton({
		fields: ['mcp_enabled', 'mcp_allow_deletes', 'mcp_prompts_collection', 'mcp_system_prompt'],
	});

	if (!mcp_enabled) {
		throw new ForbiddenError({ reason: 'MCP must be enabled' });
	}

	const mcp = new DirectusMCP({
		prompts_collection: mcp_prompts_collection,
		allow_deletes: mcp_allow_deletes,
		system_prompt: mcp_system_prompt,
	});

	mcp.handleRequest(req, res);
});

router.get('/', mcpHandler);

router.post('/', mcpHandler);

export default router;
