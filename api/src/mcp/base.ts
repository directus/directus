import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { Accountability, SchemaOverview } from '@directus/types';

export type ResourceContent =
	| {
			text: string;
	  }
	| {
			blob: string;
	  };

export type ResourceURI =
	| {
			uri: string;
	  }
	| {
			uriTemplate: string;
	  };

export type ResourceBase = {
	name: string; // Human-readable name for this type
	description?: string; // Optional description
	mimeType?: string; // Optional MIME type for all matching resources
};

export type Resource = ResourceBase & ResourceURI & ResourceContent;

export type ListResource = ResourceURI & ResourceBase;

export type ReadResource = {
	uri: string;
	mimeType?: string;
} & ResourceContent;

// Interface for all MCP Tool Handlers
export interface IMCPToolHandler {
	getTools(): Tool[];
	handleToolCall(toolName: string, params: unknown): Promise<any>;
	getAccountability(): Accountability;
	getSchema(): SchemaOverview;
}

// Base component that will be decorated
export class BaseMCPToolHandler implements IMCPToolHandler {
	protected accountability: Accountability;
	protected schema: SchemaOverview;
	protected tools: Tool[];

	getAccountability(): Accountability {
		return this.accountability;
	}
	getSchema(): SchemaOverview {
		return this.schema;
	}

	constructor(accountability: Accountability, schema: SchemaOverview, tools: Tool[] = []) {
		this.accountability = accountability;
		this.schema = schema;
		this.tools = tools;
	}

	public getTools(): Tool[] {
		return this.tools;
	}

	public async handleToolCall(toolName: string): Promise<any> {
		throw new Error(`Tool ${toolName} not implemented in base handler`);
	}
}

// Abstract decorator class following the decorator pattern
export abstract class MCPToolHandlerDecorator implements IMCPToolHandler {
	protected wrappedHandler: IMCPToolHandler;

	constructor(handler: IMCPToolHandler) {
		this.wrappedHandler = handler;
	}

	public getAccountability(): Accountability {
		return this.wrappedHandler.getAccountability();
	}

	public getSchema(): SchemaOverview {
		return this.wrappedHandler.getSchema();
	}

	public getTools(): Tool[] {
		return this.wrappedHandler.getTools();
	}

	public async handleToolCall(toolName: string, params: unknown): Promise<any> {
		return this.wrappedHandler.handleToolCall(toolName, params);
	}
}

// Utility class for standardized response handling
export interface IMCPResourceHandler {
	listResources(): ListResource[];
	getResources(): Resource[];
	handleResourceCall(uri: string): Promise<ReadResource>;
}

// Base component that will be decorated
export class BaseMCPResourceHandler implements IMCPResourceHandler {
	protected accountability: Accountability;
	protected schema: SchemaOverview;
	protected resources: Resource[];

	constructor(accountability: Accountability, schema: SchemaOverview, resources: Resource[] = []) {
		this.accountability = accountability;
		this.schema = schema;
		this.resources = resources;
	}

	public listResources(): ListResource[] {
		return this.resources.map((resource) =>
			MCPResourceHandlerDecorator.resourceToList('uri' in resource ? resource.uri : resource.uriTemplate, resource),
		);
	}

	public getResources(): Resource[] {
		return this.resources;
	}

	public handleResourceCall(uri: string): Promise<any> {
		throw new Error(`Resource ${uri} not implemented in base handler`);
	}
}

// Abstract decorator class for MCPResourceHandler
export abstract class MCPResourceHandlerDecorator implements IMCPResourceHandler {
	protected wrappedHandler: IMCPResourceHandler;
	constructor(handler: IMCPResourceHandler) {
		this.wrappedHandler = handler;
	}

	public getResources(): Resource[] {
		return this.wrappedHandler.getResources();
	}

	public listResources(): ListResource[] {
		return this.wrappedHandler.listResources();
	}

	public async handleResourceCall(uri: string): Promise<ReadResource> {
		return MCPResourceHandlerDecorator.resourceToRead(uri, this.getResource(uri));
	}

	public static resourceToRead(uri: string, resource: Resource): ReadResource {
		return {
			uri,
			mimeType: resource.mimeType!,
			blob: 'blob' in resource ? resource.blob : '',
			text: 'text' in resource ? resource.text : '',
		};
	}

	public static resourceToList(uri: string, resource: Resource): ListResource {
		return {
			uri: uri,
			name: resource.name!,
			description: resource.description!,
			mimeType: resource.mimeType!
		};
	}

	protected getResource(uri: string): Resource {
		const resource = this.wrappedHandler.getResources().find((r) => 'uri' in r && r.uri === uri);
		if (!resource) {
			throw MCPResponseUtils.createErrorResponse(`Resource with URI ${uri} not found`);
		}
		return resource;
	}
}

// Utility class for standardized response handling
export class MCPResponseUtils {
	static createSuccessResponse(data: any) {
		return {
			content: [
				{
					type: 'text',
					text: JSON.stringify(data, null, 2),
				},
			],
		};
	}

	static createErrorResponse(message: string) {
		return {
			isError: true,
			content: [
				{
					type: 'text',
					text: message,
				},
			],
		};
	}

	static handleError(error: any, defaultMessage: string) {
		const errorMessage = error?.message || defaultMessage;
		return this.createErrorResponse(errorMessage);
	}
}
