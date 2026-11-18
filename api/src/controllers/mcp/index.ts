import { useEnv } from '@directus/env';
import { ForbiddenError, InvalidCredentialsError } from '@directus/errors';
import { Router } from 'express';
import { DirectusMCP } from '../../ai/mcp/index.js';
import checkIsLocked from '../../middleware/is-locked.js';
import { SettingsService } from '../../services/settings.js';
import asyncHandler from '../../utils/async-handler.js';

const router = Router();

router.use(checkIsLocked('mcp'));

const mcpHandler = asyncHandler(async (req, res) => {
	const env = useEnv();

	const settings = new SettingsService({
		schema: req.schema,
	});

	const {
		mcp_enabled,
		mcp_oauth_enabled,
		mcp_allow_deletes,
		mcp_prompts_collection,
		mcp_system_prompt,
		mcp_system_prompt_enabled,
	} = await settings.readSingleton({
		fields: [
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

	const oauthEnabled = env.MCP_OAUTH_ENABLED === true && mcp_oauth_enabled === true;

	if (req.accountability?.oauth && !oauthEnabled) {
		throw new ForbiddenError({ reason: 'MCP OAuth must be enabled' });
	}

	// Without OAuth, don't send anonymous clients to OAuth discovery they can't use
	if (!oauthEnabled && !req.accountability?.user && !req.accountability?.role && req.accountability?.admin !== true) {
		throw new InvalidCredentialsError();
	}

	const mcp = new DirectusMCP({
		promptsCollection: mcp_prompts_collection,
		allowDeletes: mcp_allow_deletes,
		systemPromptEnabled: mcp_system_prompt_enabled,
		systemPrompt: mcp_system_prompt,
	});

	mcp.handleRequest(req, res);
});

router.get('/', mcpHandler);

router.post('/', mcpHandler);

export default router;
