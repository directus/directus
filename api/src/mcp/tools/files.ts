import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { FilesService } from '../../services/files.js';
import { useLogger } from '../../logger/index.js';
import { type IMCPToolHandler, MCPToolHandlerDecorator, MCPResponseUtils } from '../base.js';
import type { Query } from '@directus/types';

const logger = useLogger();

// File tool definitions
const FILE_TOOLS: Tool[] = [
	{
		name: 'get_files',
		description: 'Get a list of files in the Directus instance',
		inputSchema: {
			type: 'object',
			properties: {
				limit: { type: 'number', description: 'Limit the number of files returned' },
				offset: { type: 'number', description: 'Offset for pagination' },
				filter: { type: 'object', description: 'Filter criteria' },
			},
		},
	},
	{
		name: 'get_file',
		description: 'Get details about a specific file',
		inputSchema: {
			type: 'object',
			properties: {
				id: { type: 'string', description: 'ID of the file to retrieve' },
			},
			required: ['id'],
		},
	},
];

// Decorator for file operations
export class FileToolsDecorator extends MCPToolHandlerDecorator {
	constructor(handler: IMCPToolHandler) {
		super(handler);
	}

	public override getTools(): Tool[] {
		// Combine existing tools with the file tools
		return [...FILE_TOOLS, ...super.getTools()];
	}

	public override async handleToolCall(toolName: string, params: unknown): Promise<any> {
		// Handle file-specific tools
		if (toolName === 'get_files') {
			return this.getFiles(params as { limit?: number; offset?: number; filter?: any });
		} else if (toolName === 'get_file') {
			return this.getFile(params as { id: string });
		}

		// For other tools, delegate to the wrapped handler
		return super.handleToolCall(toolName, params);
	}

	private async getFiles(params: { limit?: number; offset?: number; filter?: any } = {}) {
		try {
			const filesService = new FilesService({
				accountability: this.wrappedHandler.getAccountability(),
				schema: this.wrappedHandler.getSchema(),
			});

			const query: Query = {};
			if (params.limit !== undefined) query.limit = params.limit;
			if (params.offset !== undefined) query.offset = params.offset;
			if (params.filter !== undefined) query.filter = params.filter;

			const files = await filesService.readByQuery(query);
			return MCPResponseUtils.createSuccessResponse(files);
		} catch (error) {
			if (error instanceof Error) {
				logger.error(`Error fetching files: ${error.message}`);
			} else {
				logger.error(`Error fetching files: ${String(error)}`);
			}
			return MCPResponseUtils.handleError(error, 'Error fetching files');
		}
	}

	private async getFile(params: { id: string }) {
		try {
			const filesService = new FilesService({
				accountability: this.wrappedHandler.getAccountability(),
				schema: this.wrappedHandler.getSchema(),
			});

			const file = await filesService.readOne(params.id);
			return MCPResponseUtils.createSuccessResponse(file);
		} catch (error) {
			if (error instanceof Error) {
				logger.error(`Error fetching file ${params.id}: ${error.message}`);
			} else {
				logger.error(`Error fetching file ${params.id}: ${String(error)}`);
			}

			return MCPResponseUtils.handleError(error, `Error fetching file ${params.id}`);
		}
	}
}
