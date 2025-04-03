#!/usr/bin/env node

/**
 * Directus MCP Server Start Script
 * 
 * This script launches the Directus Model Context Protocol (MCP) server,
 * allowing AI models to interact with your Directus instance.
 */

import { useLogger } from '../logger/index.js';
import { runStdioServer } from '../mcp-server.js';

const logger = useLogger();

runStdioServer().catch((error) => {
	logger.error('Fatal error running MCP server:', error);
	process.exit(1);
});