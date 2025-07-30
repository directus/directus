import { Router } from 'express';
import { DirectusMCP } from './server.js';

const router = Router();

router.get('/', (req, res) => {
	const mcp = new DirectusMCP();

	mcp.handleRequest(req, res);
});

router.post('/', (req, res) => {
	const mcp = new DirectusMCP();

	mcp.handleRequest(req, res);
});

export default router;
