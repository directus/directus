import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { CollectionsService } from '../../services/collections.js';
import { useLogger } from '../../logger/index.js';
import { type IMCPToolHandler, MCPToolHandlerDecorator, MCPResponseUtils } from '../base.js';

const logger = useLogger();

// Collection tool definitions
const COLLECTION_TOOLS: Tool[] = [
  {
    name: "read_collections",
    description: "Get a list of all collections in the Directus instance",
    inputSchema: {
      type: "object",
      properties: {},
    }
  },
  {
    name: "get_collection",
    description: "Get details about a specific collection",
    inputSchema: {
      type: "object",
      properties: {
        collection: { type: "string", description: "Name of the collection to read" },
      },
      required: ["collection"],
    },
  },
] satisfies Tool[];

// Decorator for collection operations
export class CollectionToolsDecorator extends MCPToolHandlerDecorator {
  constructor(handler: IMCPToolHandler) {
    super(handler);
  }

  public override getTools(): Tool[] {
    // Combine existing tools with the collection tools
    return [...COLLECTION_TOOLS, ...super.getTools()];
  }

  public override async handleToolCall(toolName: string, params: unknown): Promise<any> {
    console.log("CollectionToolsDecorator.handleToolCall", toolName, params);
    // Handle collection-specific tools
    if (toolName === "get_collection") {
      console.log('call getCollections');
      return this.readCollections();
    } else if (toolName === "read_collections") {
      return this.getCollection(params as { collection: string });
    }

    console.log('call super.handleToolCall');

    // For other tools, delegate to the wrapped handler
    return super.handleToolCall(toolName, params);
  }

  private async readCollections() {
    try {
      const collectionsService = new CollectionsService({
        accountability: this.wrappedHandler.getAccountability(),
        schema: this.wrappedHandler.getSchema(),
      });
      
      const collections = await collectionsService.readByQuery();
      return MCPResponseUtils.createSuccessResponse(collections);
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Error fetching collections: ${error.message}`);
      } else {
        logger.error(`Error fetching collections: ${String(error)}`);
      }
      return MCPResponseUtils.handleError(error, "Error fetching collections");
    }
  }

  private async getCollection(params: { collection: string }) {
    try {
      const collectionsService = new CollectionsService({
        accountability: this.wrappedHandler.getAccountability(),
        schema: this.wrappedHandler.getSchema(),
      });
      
      const collection = await collectionsService.readOne(params.collection);
      return MCPResponseUtils.createSuccessResponse(collection);
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Error fetching collection ${params.collection}: ${error.message}`);
      } else {
        logger.error(`Error fetching collection ${params.collection}: ${String(error)}`);
      }
      return MCPResponseUtils.handleError(error, `Error fetching collection ${params.collection}`);
    }
  }
}