import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ItemsService } from '../../services/items.js';
import { useLogger } from '../../logger/index.js';
import { type IMCPToolHandler, MCPToolHandlerDecorator, MCPResponseUtils } from '../base.js';
import type { Query } from "@directus/types";

const logger = useLogger();

// Item tool definitions
const ITEM_TOOLS: Tool[] = [
  {
    name: "read_items",
    description: "Read items from a collection with optional filtering",
    inputSchema: {
      type: "object",
      properties: {
        collection: { type: "string", description: "Name of the collection to read items from" },
        limit: { type: "number", description: "Limit the number of items returned" },
        offset: { type: "number", description: "Offset for pagination" },
        filter: { type: "object", description: "Filter criteria" },
        sort: { type: "string", description: "Sorting criteria (field direction)" },
      },
      required: ["collection"],
    },
  },
  {
    name: "read_item",
    description: "Read a single item from a collection by ID",
    inputSchema: {
      type: "object",
      properties: {
        collection: { type: "string", description: "Name of the collection to read from" },
        id: { type: "string", description: "ID of the item to read" },
      },
      required: ["collection", "id"],
    },
  },
  {
    name: "create_item",
    description: "Create a new item in a collection",
    inputSchema: {
      type: "object",
      properties: {
        collection: { type: "string", description: "Name of the collection to create an item in" },
        data: { type: "object", description: "Item data to create" },
      },
      required: ["collection", "data"],
    },
  },
  {
    name: "update_item",
    description: "Update an existing item in a collection",
    inputSchema: {
      type: "object",
      properties: {
        collection: { type: "string", description: "Name of the collection containing the item" },
        id: { type: "string", description: "ID of the item to update" },
        data: { type: "object", description: "Updated item data" },
      },
      required: ["collection", "id", "data"],
    },
  },
  {
    name: "delete_item",
    description: "Delete an item from a collection",
    inputSchema: {
      type: "object",
      properties: {
        collection: { type: "string", description: "Name of the collection containing the item" },
        id: { type: "string", description: "ID of the item to delete" },
      },
      required: ["collection", "id"],
    },
  },
];

// Decorator for item operations
export class ItemToolsDecorator extends MCPToolHandlerDecorator {
  constructor(handler: IMCPToolHandler) {
    super(handler);
  }

  public override getTools(): Tool[] {
    // Combine existing tools with the item tools
    return [...ITEM_TOOLS, ...super.getTools()];
  }

  public override async handleToolCall(toolName: string, params: unknown): Promise<any> {
    // Handle item-specific tools
    switch (toolName) {
      case "read_items":
        return this.readItems(params as { 
          collection: string, 
          limit?: number, 
          offset?: number, 
          filter?: any, 
          sort?: string 
        });
      case "read_item":
        return this.readItem(params as { collection: string, id: string });
      case "create_item":
        return this.createItem(params as { collection: string, data: any });
      case "update_item":
        return this.updateItem(params as { collection: string, id: string, data: any });
      case "delete_item":
        return this.deleteItem(params as { collection: string, id: string });
      default:
        // For other tools, delegate to the wrapped handler
        return super.handleToolCall(toolName, params);
    }
  }

  private async readItems(params: { 
    collection: string, 
    limit?: number, 
    offset?: number, 
    filter?: any, 
    sort?: string 
  }) {
    try {
      const itemsService = new ItemsService(params.collection, {
        accountability: this.wrappedHandler.getAccountability(),
        schema: this.wrappedHandler.getSchema(),
      });
      
      const query: Query = {};
      if (params.limit !== undefined) query.limit = params.limit;
      if (params.offset !== undefined) query.offset = params.offset;
      if (params.filter !== undefined) query.filter = params.filter;
      if (params.sort !== undefined) query.sort = params.sort.split(',');
      
      const items = await itemsService.readByQuery(query);
      return MCPResponseUtils.createSuccessResponse(items);
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Error reading items from ${params.collection}: ${error.message}`);
      } else {
        logger.error(`Error reading items from ${params.collection}: ${String(error)}`);
      }
      return MCPResponseUtils.handleError(error, `Error reading items from ${params.collection}`);
    }
  }

  private async readItem(params: { collection: string, id: string }) {
    try {
      const itemsService = new ItemsService(params.collection, {
        accountability: this.wrappedHandler.getAccountability(),
        schema: this.wrappedHandler.getSchema(),
      });
      
      const item = await itemsService.readOne(params.id);
      return MCPResponseUtils.createSuccessResponse(item);
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Error reading item ${params.id} from ${params.collection}: ${error.message}`);
      } else {
        logger.error(`Error reading item ${params.id} from ${params.collection}: ${String(error)}`);
      }
      return MCPResponseUtils.handleError(error, `Error reading item ${params.id} from ${params.collection}`);
    }
  }

  private async createItem(params: { collection: string, data: any }) {
    try {
      const itemsService = new ItemsService(params.collection, {
        accountability: this.wrappedHandler.getAccountability(),
        schema: this.wrappedHandler.getSchema(),
      });
      
      const key = await itemsService.createOne(params.data);
      const item = await itemsService.readOne(key);
      
      return MCPResponseUtils.createSuccessResponse(item);
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Error creating item in ${params.collection}: ${error.message}`);
      } else {
        logger.error(`Error creating item in ${params.collection}: ${String(error)}`);
      }
      return MCPResponseUtils.handleError(error, `Error creating item in ${params.collection}`);
    }
  }

  private async updateItem(params: { collection: string, id: string, data: any }) {
    try {
      const itemsService = new ItemsService(params.collection, {
        accountability: this.wrappedHandler.getAccountability(),
        schema: this.wrappedHandler.getSchema(),
      });
      
      await itemsService.updateOne(params.id, params.data);
      const item = await itemsService.readOne(params.id);
      
      return MCPResponseUtils.createSuccessResponse(item);
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Error updating item ${params.id} in ${params.collection}: ${error.message}`);
      } else {
        logger.error(`Error updating item ${params.id} in ${params.collection}: ${String(error)}`);
      }
      return MCPResponseUtils.handleError(error, `Error updating item ${params.id} in ${params.collection}`);
    }
  }

  private async deleteItem(params: { collection: string, id: string }) {
    try {
      const itemsService = new ItemsService(params.collection, {
        accountability: this.wrappedHandler.getAccountability(),
        schema: this.wrappedHandler.getSchema(),
      });
      
      await itemsService.deleteOne(params.id);
      
      return {
        content: [{
          type: "text",
          text: `Successfully deleted item ${params.id} from ${params.collection}`
        }]
      };
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Error deleting item ${params.id} from ${params.collection}: ${error.message}`);
      } else {
        logger.error(`Error deleting item ${params.id} from ${params.collection}: ${String(error)}`);
      }
      return MCPResponseUtils.handleError(error, `Error deleting item ${params.id} from ${params.collection}`);
    }
  }
}