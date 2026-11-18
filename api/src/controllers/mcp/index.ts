import { useEnv } from '@directus/env';
import { ForbiddenError } from '@directus/errors';
import { Router } from 'express';
import { DirectusMCP } from '../../ai/mcp/index.js';
import checkIsLocked from '../../middleware/is-locked.js';
import { SettingsService } from '../../services/settings.js';
import asyncHandler from '../../utils/async-handler.js';
import { getProjectIconPng } from '../../utils/project-icon.js';

const router = Router();

router.use(checkIsLocked('mcp'));

const mcpHandler = asyncHandler(async (req, res) => {
	const env = useEnv();

	const settings = new SettingsService({
		schema: req.schema,
	});

	const {
		project_name,
		project_descriptor,
		project_url,
		project_color,
		mcp_enabled,
		mcp_oauth_enabled,
		mcp_allow_deletes,
		mcp_prompts_collection,
		mcp_system_prompt,
		mcp_system_prompt_enabled,
	} = await settings.readSingleton({
		fields: [
			'project_name',
			'project_descriptor',
			'project_url',
			'project_color',
			'mcp_enabled',
			'mcp_oauth_enabled',
			'mcp_allow_deletes',
			'mcp_prompts_collection',
			'mcp_system_prompt',
			'mcp_system_prompt_enabled',
		],
	});

	if (!mcp_enabled) {
		throw new ForbiddenError({ reason: 'MCP must be enabled' });
	}

	if (req.accountability?.oauth && (env.MCP_OAUTH_ENABLED !== true || mcp_oauth_enabled !== true)) {
		throw new ForbiddenError({ reason: 'MCP OAuth must be enabled' });
	}

	const mcp = new DirectusMCP({
		project: {
			name: project_name,
			descriptor: project_descriptor,
			url: project_url,
			icon: await getProjectIconPng(project_color ?? null),
		},
		promptsCollection: mcp_prompts_collection,
		allowDeletes: mcp_allow_deletes,
		systemPromptEnabled: mcp_system_prompt_enabled,
		systemPrompt: mcp_system_prompt,
	});

	await mcp.handleRequest(req, res);
});

router.get('/', mcpHandler);

router.post('/', mcpHandler);

export default router;
