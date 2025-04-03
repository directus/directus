import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { PermissionsService } from '../../services/permissions.js';
import { useLogger } from '../../logger/index.js';
import { type IMCPToolHandler, MCPToolHandlerDecorator, MCPResponseUtils } from '../base.js';
import type { Query } from '@directus/types';

const logger = useLogger();

// Permission tool definitions
const PERMISSION_TOOLS: Tool[] = [
	{
		name: 'get_permissions',
		description: 'Get a list of permissions',
		inputSchema: {
			type: 'object',
			properties: {
				filter: { type: 'object', description: 'Filter criteria for permissions' },
				limit: { type: 'number', description: 'Limit the number of permissions returned' },
				offset: { type: 'number', description: 'Offset for pagination' },
				sort: { type: 'array', description: 'Sort criteria', items: { type: 'string' } },
			},
		},
	},
	{
		name: 'get_permission',
		description: 'Get details about a specific permission',
		inputSchema: {
			type: 'object',
			properties: {
				id: { type: 'string', description: 'ID of the permission to get' },
			},
			required: ['id'],
		},
	},
	{
		name: 'create_permission',
		description: 'Create a new permission',
		inputSchema: {
			type: 'object',
			properties: {
				data: {
					type: 'object',
					description: 'Permission data including collection, action, role, fields, etc.',
				},
			},
			required: ['data'],
		},
	},
	{
		name: 'update_permission',
		description: 'Update an existing permission',
		inputSchema: {
			type: 'object',
			properties: {
				id: { type: 'string', description: 'ID of the permission to update' },
				data: { type: 'object', description: 'Permission data to update' },
			},
			required: ['id', 'data'],
		},
	},
	{
		name: 'delete_permission',
		description: 'Delete a permission',
		inputSchema: {
			type: 'object',
			properties: {
				id: { type: 'string', description: 'ID of the permission to delete' },
			},
			required: ['id'],
		},
	},
];

// Decorator for permission operations
export class PermissionToolsDecorator extends MCPToolHandlerDecorator {
	constructor(handler: IMCPToolHandler) {
		super(handler);
	}

	public override getTools(): Tool[] {
		return [...PERMISSION_TOOLS, ...super.getTools()];
	}

	public override async handleToolCall(toolName: string, params: unknown): Promise<any> {
		switch (toolName) {
			case 'get_permissions':
				return this.getPermissions(params as { filter?: any; limit?: number; offset?: number; sort?: string[] });
			case 'get_permission':
				return this.getPermission(params as { id: string });
			case 'create_permission':
				return this.createPermission(params as { data: any });
			case 'update_permission':
				return this.updatePermission(params as { id: string; data: any });
			case 'delete_permission':
				return this.deletePermission(params as { id: string });
			default:
				return super.handleToolCall(toolName, params);
		}
	}

	private async getPermissions(params: { filter?: any; limit?: number; offset?: number; sort?: string[] } = {}) {
		try {
			const permissionsService = new PermissionsService({
				accountability: this.wrappedHandler.getAccountability(),
				schema: this.wrappedHandler.getSchema(),
			});

			const query: Query = {};
			if (params.filter) query.filter = params.filter;
			if (params.limit) query.limit = params.limit;
			if (params.offset) query.offset = params.offset;
			if (params.sort) query.sort = params.sort;

			const permissions = await permissionsService.readByQuery(query);
			return MCPResponseUtils.createSuccessResponse(permissions);
		} catch (error) {
			if (error instanceof Error) {
				logger.error(`Error fetching permissions: ${error.message}`);
			} else {
				logger.error(`Error fetching permissions: ${String(error)}`);
			}
			return MCPResponseUtils.handleError(error, 'Error fetching permissions');
		}
	}

	private async getPermission(params: { id: string }) {
		try {
			const permissionsService = new PermissionsService({
				accountability: this.wrappedHandler.getAccountability(),
				schema: this.wrappedHandler.getSchema(),
			});

			const permission = await permissionsService.readOne(params.id);
			return MCPResponseUtils.createSuccessResponse(permission);
		} catch (error) {
			if (error instanceof Error) {
				logger.error(`Error fetching permission ${params.id}: ${error.message}`);
			} else {
				logger.error(`Error fetching permission ${params.id}: ${String(error)}`);
			}
			return MCPResponseUtils.handleError(error, `Error fetching permission ${params.id}`);
		}
	}

	private async createPermission(params: { data: any }) {
		try {
			const permissionsService = new PermissionsService({
				accountability: this.wrappedHandler.getAccountability(),
				schema: this.wrappedHandler.getSchema(),
			});

			const permissionId = await permissionsService.createOne(params.data);
			const permission = await permissionsService.readOne(permissionId);

			return MCPResponseUtils.createSuccessResponse(permission);
		} catch (error) {
			if (error instanceof Error) {
				logger.error(`Error creating permission: ${error.message}`);
			} else {
				logger.error(`Error creating permission: ${String(error)}`);
			}
			return MCPResponseUtils.handleError(error, 'Error creating permission');
		}
	}

	private async updatePermission(params: { id: string; data: any }) {
		try {
			const permissionsService = new PermissionsService({
				accountability: this.wrappedHandler.getAccountability(),
				schema: this.wrappedHandler.getSchema(),
			});

			await permissionsService.updateOne(params.id, params.data);
			const permission = await permissionsService.readOne(params.id);

			return MCPResponseUtils.createSuccessResponse(permission);
		} catch (error) {
			if (error instanceof Error) {
				logger.error(`Error updating permission ${params.id}: ${error.message}`);
			} else {
				logger.error(`Error updating permission ${params.id}: ${String(error)}`);
			}
			return MCPResponseUtils.handleError(error, `Error updating permission ${params.id}`);
		}
	}

	private async deletePermission(params: { id: string }) {
		try {
			const permissionsService = new PermissionsService({
				accountability: this.wrappedHandler.getAccountability(),
				schema: this.wrappedHandler.getSchema(),
			});

			await permissionsService.deleteOne(params.id);

			return {
				content: [
					{
						type: 'text',
						text: `Successfully deleted permission ${params.id}`,
					},
				],
			};
		} catch (error) {
			if (error instanceof Error) {
				logger.error(`Error deleting permission ${params.id}: ${error.message}`);
			} else {
				logger.error(`Error deleting permission ${params.id}: ${String(error)}`);
			}
			return MCPResponseUtils.handleError(error, `Error deleting permission ${params.id}`);
		}
	}
}
