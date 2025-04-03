import type { Accountability, SchemaOverview } from '@directus/types';
import { BaseMCPResourceHandler, BaseMCPToolHandler, type IMCPResourceHandler, type IMCPToolHandler, MCPResponseUtils } from './base.js';
import { CollectionToolsDecorator } from './tools/collections.js';
import { ItemToolsDecorator } from './tools/items.js';
import { FileToolsDecorator } from './tools/files.js';
import { FieldToolsDecorator } from './tools/fields.js';
import { UserToolsDecorator } from './tools/users.js';
import { RoleToolsDecorator } from './tools/roles.js';
import { PermissionToolsDecorator } from './tools/permissions.js';
import { MailToolsDecorator } from './tools/mail.js';
import { FolderToolsDecorator } from './tools/folders.js';
import { ResourceDecorator } from './resources/resources.js';

/**
 * Concrete implementation of the base handler 
 * This is the innermost component of the decorator pattern
 */
export class CoreMCPToolHandler extends BaseMCPToolHandler {
  constructor(accountability: Accountability, schema: SchemaOverview) {
    super(accountability, schema, []);
    console.log('CoreMCPToolHandler initialized', 'Class: ', this.constructor.name);
  }

  public override async handleToolCall(toolName: string): Promise<any> {
    // This is the fallback handler for any tools not handled by other decorators
    return MCPResponseUtils.createErrorResponse(`Tool "${toolName}" not implemented`);
  }
}

/**
 * Factory to create a fully decorated MCP tool handler with all available decorators
 */
export function createFullyDecoratedToolHandler(accountability: Accountability, schema: SchemaOverview): IMCPToolHandler {
  // Create the base handler
  let handler: IMCPToolHandler = new CoreMCPToolHandler(accountability, schema);
  
  // Apply decorators (the order matters - later decorators wrap earlier ones)
  handler = new CollectionToolsDecorator(handler);
  handler = new ItemToolsDecorator(handler);
  handler = new FileToolsDecorator(handler);
  
  // Apply the new decorators
  handler = new FieldToolsDecorator(handler);
  handler = new UserToolsDecorator(handler);
  handler = new RoleToolsDecorator(handler);
  handler = new PermissionToolsDecorator(handler);
  handler = new MailToolsDecorator(handler);
  handler = new FolderToolsDecorator(handler);
  
  return handler;
}

/**
 * Factory to create a custom decorated MCP tool handler with selected decorators
 */
export function createCustomToolHandler(
  accountability: Accountability, 
  schema: SchemaOverview,
  options: {
    useCollections?: boolean;
    useItems?: boolean;
    useFiles?: boolean;
    useFields?: boolean;
    useUsers?: boolean;
    useRoles?: boolean;
    usePermissions?: boolean;
    useMail?: boolean;
    useFolders?: boolean;
    useResources?: boolean;
  } = {
    useCollections: true,
    useItems: true,
    useFiles: true,
    useFields: true,
    useUsers: true,
    useRoles: true,
    usePermissions: true,
    useMail: true,
    useFolders: true,
    useResources: true
  }
): IMCPToolHandler {
  // Create the base handler
  let handler: IMCPToolHandler = new CoreMCPToolHandler(accountability, schema);
  
  // Apply only selected decorators
  if (options.useCollections) {
    handler = new CollectionToolsDecorator(handler);
  }
  
  if (options.useItems) {
    handler = new ItemToolsDecorator(handler);
  }
  
  if (options.useFiles) {
    handler = new FileToolsDecorator(handler);
  }
  
  if (options.useFields) {
    handler = new FieldToolsDecorator(handler);
  }
  
  if (options.useUsers) {
    handler = new UserToolsDecorator(handler);
  }
  
  if (options.useRoles) {
    handler = new RoleToolsDecorator(handler);
  }
  
  if (options.usePermissions) {
    handler = new PermissionToolsDecorator(handler);
  }
  
  if (options.useMail) {
    handler = new MailToolsDecorator(handler);
  }
  
  if (options.useFolders) {
    handler = new FolderToolsDecorator(handler);
  }
  
  return handler;
}

export class CoreMCPResourceHandler extends BaseMCPResourceHandler {
  constructor(accountability: Accountability, schema: SchemaOverview) {
    super(accountability, schema, []);
  }

  public override async handleResourceCall(resourceName: string): Promise<any> {
    // This is the fallback handler for any resources not handled by other decorators
    return MCPResponseUtils.createErrorResponse(`Resource "${resourceName}" not implemented`);
  }
}

/**
 * Factory to create a fully decorated MCP resource handler with all available decorators
 */
export function createFullyDecoratedResourceHandler(accountability: Accountability, schema: SchemaOverview): IMCPResourceHandler {
  // Create the base handler
  let handler: IMCPResourceHandler = new CoreMCPResourceHandler(accountability, schema);
  
  // Apply decorators (the order matters - later decorators wrap earlier ones)
  handler = new ResourceDecorator(handler);
  
  return handler;
}

/**
 * Factory to create a custom decorated MCP resource handler with selected decorators
 */
export function createCustomResourceHandler(
  accountability: Accountability, 
  schema: SchemaOverview,
  options: {
    useResources?: boolean;
  } = {
    useResources: true
  }
): IMCPResourceHandler {
  // Create the base handler
  let handler: IMCPResourceHandler = new CoreMCPResourceHandler(accountability, schema);
  
  // Apply only selected decorators
  if (options.useResources) {
    handler = new ResourceDecorator(handler);
  }
  
  return handler;
}