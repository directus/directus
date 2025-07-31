import { Router } from 'express';
import { DirectusMCP } from '../mcp/index.js';
import asyncHandler from '../utils/async-handler.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
	const mcp = new DirectusMCP();

	await mcp.handleRequest(req, res);
}));

router.post('/', asyncHandler(async (req, res) => {
	const mcp = new DirectusMCP();

	await mcp.handleRequest(req, res);
}));

export default router;
