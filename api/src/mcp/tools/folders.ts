import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { FoldersService } from '../../services/folders.js';
import { useLogger } from '../../logger/index.js';
import { type IMCPToolHandler, MCPToolHandlerDecorator, MCPResponseUtils } from '../base.js';
import type { Query } from "@directus/types";

const logger = useLogger();

// Folder tool definitions
const FOLDER_TOOLS: Tool[] = [
  {
    name: "get_folders",
    description: "Get a list of folders",
    inputSchema: {
      type: "object",
      properties: {
        filter: { type: "object", description: "Filter criteria for folders" },
        limit: { type: "number", description: "Limit the number of folders returned" },
        offset: { type: "number", description: "Offset for pagination" },
        sort: { type: "array", description: "Sort criteria", items: { type: "string" } },
      },
    },
  },
  {
    name: "get_folder",
    description: "Get details about a specific folder",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "ID of the folder to get" },
      },
      required: ["id"],
    },
  },
  {
    name: "create_folder",
    description: "Create a new folder",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Name of the folder" },
        parent: { type: "string", description: "Parent folder ID (optional)" },
      },
      required: ["name"],
    },
  },
  {
    name: "update_folder",
    description: "Update an existing folder",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "ID of the folder to update" },
        data: { type: "object", description: "Folder data to update" },
      },
      required: ["id", "data"],
    },
  },
  {
    name: "delete_folder",
    description: "Delete a folder",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "ID of the folder to delete" },
      },
      required: ["id"],
    },
  },
];

// Decorator for folder operations
export class FolderToolsDecorator extends MCPToolHandlerDecorator {
  constructor(handler: IMCPToolHandler) {
    super(handler);
  }

  public override getTools(): Tool[] {
    return [...FOLDER_TOOLS, ...super.getTools()];
  }

  public override async handleToolCall(toolName: string, params: unknown): Promise<any> {
    switch (toolName) {
      case "get_folders":
        return this.getFolders(params as { filter?: any, limit?: number, offset?: number, sort?: string[] });
      case "get_folder":
        return this.getFolder(params as { id: string });
      case "create_folder":
        return this.createFolder(params as { name: string, parent?: string });
      case "update_folder":
        return this.updateFolder(params as { id: string, data: any });
      case "delete_folder":
        return this.deleteFolder(params as { id: string });
      default:
        return super.handleToolCall(toolName, params);
    }
  }

  private async getFolders(params: { filter?: any, limit?: number, offset?: number, sort?: string[] } = {}) {
    try {
      const foldersService = new FoldersService({
        accountability: this.wrappedHandler.getAccountability(),
        schema: this.wrappedHandler.getSchema(),
      });
      
      const query: Query = {};
      if (params.filter) query.filter = params.filter;
      if (params.limit) query.limit = params.limit;
      if (params.offset) query.offset = params.offset;
      if (params.sort) query.sort = params.sort;
      
      const folders = await foldersService.readByQuery(query);
      return MCPResponseUtils.createSuccessResponse(folders);
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Error fetching folders: ${error.message}`);
      } else {
        logger.error(`Error fetching folders: ${JSON.stringify(error)}`);
      }
      return MCPResponseUtils.handleError(error, "Error fetching folders");
    }
  }

  private async getFolder(params: { id: string }) {
    try {
      const foldersService = new FoldersService({
        accountability: this.wrappedHandler.getAccountability(),
        schema: this.wrappedHandler.getSchema(),
      });
      
      const folder = await foldersService.readOne(params.id);
      return MCPResponseUtils.createSuccessResponse(folder);
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Error fetching folder ${params.id}: ${error.message}`);
      } else {
        logger.error(`Error fetching folder ${params.id}: ${JSON.stringify(error)}`);
      }
      return MCPResponseUtils.handleError(error, `Error fetching folder ${params.id}`);
    }
  }

  private async createFolder(params: { name: string, parent?: string }) {
    try {
      const foldersService = new FoldersService({
        accountability: this.wrappedHandler.getAccountability(),
        schema: this.wrappedHandler.getSchema(),
      });
      
      const data: any = { name: params.name };
      if (params.parent) data.parent = params.parent;
      
      const folderId = await foldersService.createOne(data);
      const folder = await foldersService.readOne(folderId);
      
      return MCPResponseUtils.createSuccessResponse(folder);
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Error creating folder: ${error.message}`);
      } else {
        logger.error(`Error creating folder: ${JSON.stringify(error)}`);
      }
      return MCPResponseUtils.handleError(error, "Error creating folder");
    }
  }

  private async updateFolder(params: { id: string, data: any }) {
    try {
      const foldersService = new FoldersService({
        accountability: this.wrappedHandler.getAccountability(),
        schema: this.wrappedHandler.getSchema(),
      });
      
      await foldersService.updateOne(params.id, params.data);
      const folder = await foldersService.readOne(params.id);
      
      return MCPResponseUtils.createSuccessResponse(folder);
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Error updating folder ${params.id}: ${error.message}`);
      } else {
        logger.error(`Error updating folder ${params.id}: ${JSON.stringify(error)}`);
      }
      return MCPResponseUtils.handleError(error, `Error updating folder ${params.id}`);
    }
  }

  private async deleteFolder(params: { id: string }) {
    try {
      const foldersService = new FoldersService({
        accountability: this.wrappedHandler.getAccountability(),
        schema: this.wrappedHandler.getSchema(),
      });
      
      await foldersService.deleteOne(params.id);
      
      return {
        content: [{
          type: "text",
          text: `Successfully deleted folder ${params.id}`
        }]
      };
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Error deleting folder ${params.id}: ${error.message}`);
      } else {
        logger.error(`Error deleting folder ${params.id}: ${JSON.stringify(error)}`);
      } 
      return MCPResponseUtils.handleError(error, `Error deleting folder ${params.id}`);
    }
  }
}