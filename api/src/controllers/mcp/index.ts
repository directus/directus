import { Router } from 'express';
import asyncHandler from '../../utils/async-handler.js';
import { DirectusMCP } from './server.js';

const router = Router();

router.get(
	'/',
	asyncHandler(async (req, res) => {
		const mcp = new DirectusMCP();

		mcp.handleRequest(req, res);
	}),
);

router.post(
	'/',
	asyncHandler(async (req, res) => {
		const mcp = new DirectusMCP();

		mcp.handleRequest(req, res);
	}),
);

export default router;
