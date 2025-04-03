import { useLogger } from '../../logger/index.js';
import {
	MCPResourceHandlerDecorator,
	type IMCPResourceHandler,
	type Resource,
} from '../base.js';

// Documentation Resources
const MCP_RESOURCES = [
	// Server overview
	{
		uri: 'mcp://docs/overview',
		mimeType: 'text/markdown',
		name: 'MCP Server Overview',
		description: 'Overview of the Directus MCP server implementation',
		text: `# Directus MCP Server
    
This Model Context Protocol (MCP) server provides access to Directus CMS functionality through a standardized interface.

## What is MCP?
The Model Context Protocol (MCP) is a communication protocol that enables AI assistants to interact with external systems in a controlled manner. It provides a structured way for clients to expose data and functionality to LLMs.

## This Implementation
This Directus MCP server implementation exposes various Directus services as tools that can be used by MCP clients. These tools allow AI assistants to:

- Read, create, update, and delete items in collections
- Manage files, folders, and assets
- Work with users, roles, and permissions
- Manage fields and collection schemas
- Send emails
- And more

Each tool follows a consistent pattern where it accepts parameters, performs an operation using the appropriate Directus service, and returns a standardized response.`,
	},

	// Tools overview
	{
		uri: 'mcp://docs/tools/overview',
		mimeType: 'text/markdown',
		name: 'MCP Tools Overview',
		description: 'Overview of the tools available in the Directus MCP server',
		text: `# Directus MCP Tools

The Directus MCP server exposes functionality through a series of tools organized by service areas:

## Collections
Tools for working with collection definitions and metadata.

## Items
Tools for performing CRUD operations on items within collections.

## Files
Tools for managing files and assets.

## Fields
Tools for managing collection fields and schema.

## Users
Tools for user management and authentication.

## Roles
Tools for role management and assignments.

## Permissions
Tools for managing access control permissions.

## Mail
Tools for sending emails and working with templates.

## Folders
Tools for organizing files into folders.

Each tool category contains specific functions for reading, querying, creating, updating, and deleting resources.`,
	},

	// Collections tools
	{
		uri: 'mcp://docs/tools/collections',
		mimeType: 'text/markdown',
		name: 'Collections Tools',
		description: 'Documentation for collection management tools',
		text: `# Collection Management Tools

## get_collections
Returns a list of all collections in the Directus instance.

**Parameters**: None

**Returns**: Array of collection objects with metadata

## read_collection
Returns details about a specific collection.

**Parameters**:
- collection: string (Name of the collection to read)

**Returns**: Collection object with metadata

**Example**:
\`\`\`json
{
  "collection": "articles"
}
\`\`\`
`,
	},

	// Items tools
	{
		uri: 'mcp://docs/tools/items',
		mimeType: 'text/markdown',
		name: 'Items Tools',
		description: 'Documentation for item management tools',
		text: `# Item Management Tools

## read_items
Read multiple items from a collection with optional filtering, sorting, and pagination.

**Parameters**:
- collection: string (Required - Name of the collection to read items from)
- limit: number (Optional - Maximum number of items to return)
- offset: number (Optional - Number of items to skip for pagination)
- filter: object (Optional - Filter criteria)
- sort: string (Optional - Sorting criteria, comma-separated fields with optional -prefix for descending)

**Returns**: Array of items matching the criteria

**Example**:
\`\`\`json
{
  "collection": "articles",
  "limit": 10,
  "offset": 0,
  "filter": {
    "status": {
      "_eq": "published"
    }
  },
  "sort": "date_published,-title"
}
\`\`\`

## read_item
Read a single item from a collection by ID.

**Parameters**:
- collection: string (Required - Name of the collection to read from)
- id: string (Required - ID of the item to read)

**Returns**: Single item object

**Example**:
\`\`\`json
{
  "collection": "articles",
  "id": "123"
}
\`\`\`

## create_item
Create a new item in a collection.

**Parameters**:
- collection: string (Required - Name of the collection to create an item in)
- data: object (Required - Item data to create)

**Returns**: The created item object

**Example**:
\`\`\`json
{
  "collection": "articles",
  "data": {
    "title": "New Article",
    "content": "This is the article content",
    "status": "draft"
  }
}
\`\`\`

## update_item
Update an existing item in a collection.

**Parameters**:
- collection: string (Required - Name of the collection containing the item)
- id: string (Required - ID of the item to update)
- data: object (Required - Updated item data)

**Returns**: The updated item object

**Example**:
\`\`\`json
{
  "collection": "articles",
  "id": "123",
  "data": {
    "title": "Updated Article Title",
    "status": "published"
  }
}
\`\`\`

## delete_item
Delete an item from a collection.

**Parameters**:
- collection: string (Required - Name of the collection containing the item)
- id: string (Required - ID of the item to delete)

**Returns**: Confirmation message

**Example**:
\`\`\`json
{
  "collection": "articles",
  "id": "123"
}
\`\`\`
`,
	},

	// Files tools
	{uri: 'mcp://docs/tools/files',
		mimeType: 'text/markdown',
		name: 'Files Tools',
		description: 'Documentation for file management tools',
		text: `# File Management Tools

## get_files
Get a list of files in the Directus instance with optional filtering and pagination.

**Parameters**:
- limit: number (Optional - Maximum number of files to return)
- offset: number (Optional - Number of files to skip for pagination)
- filter: object (Optional - Filter criteria)

**Returns**: Array of file objects

**Example**:
\`\`\`json
{
  "limit": 10,
  "offset": 0,
  "filter": {
    "type": {
      "_contains": "image"
    }
  }
}
\`\`\`

## get_file
Get details about a specific file.

**Parameters**:
- id: string (Required - ID of the file to retrieve)

**Returns**: File object with metadata

**Example**:
\`\`\`json
{
  "id": "123"
}
\`\`\`
`,
	},

	// Fields tools
{
  uri: 	'mcp://docs/tools/fields',
		mimeType: 'text/markdown',
		name: 'Fields Tools',
		description: 'Documentation for field management tools',
		text: `# Field Management Tools

## get_fields
Get all fields for a collection.

**Parameters**:
- collection: string (Required - Name of the collection to get fields from)

**Returns**: Array of field objects with metadata

**Example**:
\`\`\`json
{
  "collection": "articles"
}
\`\`\`

## get_field
Get a specific field from a collection.

**Parameters**:
- collection: string (Required - Name of the collection)
- field: string (Required - Name of the field)

**Returns**: Field object with metadata

**Example**:
\`\`\`json
{
  "collection": "articles",
  "field": "title"
}
\`\`\`

## create_field
Create a new field in a collection.

**Parameters**:
- collection: string (Required - Name of the collection)
- field: object (Required - Field configuration object)

**Returns**: The created field object

**Example**:
\`\`\`json
{
  "collection": "articles",
  "field": {
    "field": "subtitle",
    "type": "string",
    "schema": {
      "is_nullable": true
    },
    "meta": {
      "interface": "input",
      "width": "full"
    }
  }
}
\`\`\`

## update_field
Update an existing field in a collection.

**Parameters**:
- collection: string (Required - Name of the collection)
- field: string (Required - Current name of the field)
- data: object (Required - Updated field configuration)

**Returns**: The updated field object

**Example**:
\`\`\`json
{
  "collection": "articles",
  "field": "subtitle",
  "data": {
    "meta": {
      "width": "half",
      "note": "Secondary headline for the article"
    }
  }
}
\`\`\`

## delete_field
Delete a field from a collection.

**Parameters**:
- collection: string (Required - Name of the collection)
- field: string (Required - Name of the field to delete)

**Returns**: Confirmation message

**Example**:
\`\`\`json
{
  "collection": "articles",
  "field": "subtitle"
}
\`\`\`
`,
	},

	// Users tools
	{
    uri: 'mcp://docs/tools/users',
		mimeType: 'text/markdown',
		name: 'Users Tools',
		description: 'Documentation for user management tools',
		text: `# User Management Tools

## get_users
Get a list of users with optional filtering and pagination.

**Parameters**:
- filter: object (Optional - Filter criteria for users)
- limit: number (Optional - Maximum number of users to return)
- offset: number (Optional - Number of users to skip for pagination)
- sort: array (Optional - Sort criteria)

**Returns**: Array of user objects

**Example**:
\`\`\`json
{
  "limit": 10,
  "filter": {
    "role": {
      "_eq": "editor"
    }
  }
}
\`\`\`

## get_user
Get details about a specific user.

**Parameters**:
- id: string (Required - ID of the user to get)

**Returns**: User object

**Example**:
\`\`\`json
{
  "id": "123"
}
\`\`\`

## create_user
Create a new user.

**Parameters**:
- data: object (Required - User data including email, password, role, etc.)

**Returns**: The created user object

**Example**:
\`\`\`json
{
  "data": {
    "email": "user@example.com",
    "password": "password123",
    "role": "editor",
    "first_name": "John",
    "last_name": "Doe"
  }
}
\`\`\`

## update_user
Update an existing user.

**Parameters**:
- id: string (Required - ID of the user to update)
- data: object (Required - User data to update)

**Returns**: The updated user object

**Example**:
\`\`\`json
{
  "id": "123",
  "data": {
    "role": "admin",
    "title": "Chief Editor"
  }
}
\`\`\`

## delete_user
Delete a user.

**Parameters**:
- id: string (Required - ID of the user to delete)

**Returns**: Confirmation message

**Example**:
\`\`\`json
{
  "id": "123"
}
\`\`\`

## invite_user
Invite a user to the platform.

**Parameters**:
- email: string (Required - Email address of the user to invite)
- role: string (Required - Role ID to assign to the user)
- invite_url: string (Optional - Custom invite URL)

**Returns**: Confirmation message

**Example**:
\`\`\`json
{
  "email": "newuser@example.com",
  "role": "editor"
}
\`\`\`

## get_current_user
Get information about the current user.

**Parameters**: None

**Returns**: Current user object
`,
	},

	// Roles tools
	{
    uri: 'mcp://docs/tools/roles',
		mimeType: 'text/markdown',
		name: 'Roles Tools',
		description: 'Documentation for role management tools',
		text: `# Role Management Tools

## get_roles
Get a list of all roles with optional filtering and pagination.

**Parameters**:
- filter: object (Optional - Filter criteria for roles)
- limit: number (Optional - Maximum number of roles to return)
- offset: number (Optional - Number of roles to skip for pagination)
- sort: array (Optional - Sort criteria)

**Returns**: Array of role objects

**Example**:
\`\`\`json
{
  "limit": 10,
  "filter": {
    "admin_access": {
      "_eq": true
    }
  }
}
\`\`\`

## get_role
Get details about a specific role.

**Parameters**:
- id: string (Required - ID of the role to get)

**Returns**: Role object

**Example**:
\`\`\`json
{
  "id": "123"
}
\`\`\`

## create_role
Create a new role.

**Parameters**:
- data: object (Required - Role data including name, admin_access, app_access, etc.)

**Returns**: The created role object

**Example**:
\`\`\`json
{
  "data": {
    "name": "Content Reviewer",
    "admin_access": false,
    "app_access": true,
    "description": "Can review but not publish content"
  }
}
\`\`\`

## update_role
Update an existing role.

**Parameters**:
- id: string (Required - ID of the role to update)
- data: object (Required - Role data to update)

**Returns**: The updated role object

**Example**:
\`\`\`json
{
  "id": "123",
  "data": {
    "description": "Updated role description",
    "enforce_tfa": true
  }
}
\`\`\`

## delete_role
Delete a role.

**Parameters**:
- id: string (Required - ID of the role to delete)

**Returns**: Confirmation message

**Example**:
\`\`\`json
{
  "id": "123"
}
\`\`\`
`,
	},

	// Permissions tools
	{
    uri: 'mcp://docs/tools/permissions',
		mimeType: 'text/markdown',
		name: 'Permissions Tools',
		description: 'Documentation for permission management tools',
		text: `# Permission Management Tools

## get_permissions
Get a list of permissions with optional filtering and pagination.

**Parameters**:
- filter: object (Optional - Filter criteria for permissions)
- limit: number (Optional - Maximum number of permissions to return)
- offset: number (Optional - Number of permissions to skip for pagination)
- sort: array (Optional - Sort criteria)

**Returns**: Array of permission objects

**Example**:
\`\`\`json
{
  "filter": {
    "collection": {
      "_eq": "articles"
    }
  }
}
\`\`\`

## get_permission
Get details about a specific permission.

**Parameters**:
- id: string (Required - ID of the permission to get)

**Returns**: Permission object

**Example**:
\`\`\`json
{
  "id": "123"
}
\`\`\`

## create_permission
Create a new permission.

**Parameters**:
- data: object (Required - Permission data including collection, action, role, fields, etc.)

**Returns**: The created permission object

**Example**:
\`\`\`json
{
  "data": {
    "collection": "articles",
    "action": "read",
    "role": "editor",
    "fields": ["id", "title", "content", "status"]
  }
}
\`\`\`

## update_permission
Update an existing permission.

**Parameters**:
- id: string (Required - ID of the permission to update)
- data: object (Required - Permission data to update)

**Returns**: The updated permission object

**Example**:
\`\`\`json
{
  "id": "123",
  "data": {
    "fields": ["id", "title", "content", "status", "author"],
    "validation": {}
  }
}
\`\`\`

## delete_permission
Delete a permission.

**Parameters**:
- id: string (Required - ID of the permission to delete)

**Returns**: Confirmation message

**Example**:
\`\`\`json
{
  "id": "123"
}
\`\`\`
`,
	},

	// Mail tools
	{
    uri: 'mcp://docs/tools/mail',
		mimeType: 'text/markdown',
		name: 'Mail Tools',
		description: 'Documentation for email tools',
		text: `# Email Management Tools

## send_email
Send an email through the system.

**Parameters**:
- to: string (Required - Email address or addresses of recipients)
- subject: string (Required - Subject line of the email)
- text: string (Optional - Plain text content of the email)
- html: string (Optional - HTML content of the email)
- from: string (Optional - Email address of the sender)
- cc: string (Optional - Email address or addresses for CC)
- bcc: string (Optional - Email address or addresses for BCC)

**Note**: Either text or html must be provided.

**Returns**: Confirmation message

**Example**:
\`\`\`json
{
  "to": "recipient@example.com",
  "subject": "Important Update",
  "text": "This is a plain text email content.",
  "cc": "manager@example.com"
}
\`\`\`

## send_email_with_template
Send an email using a template.

**Parameters**:
- to: string (Required - Email address or addresses of recipients)
- subject: string (Required - Subject line of the email)
- template: object (Required - Template configuration with name and data)
  - name: string (Required - Name of the template to use)
  - data: object (Required - Template data)
- from: string (Optional - Email address of the sender)
- cc: string (Optional - Email address or addresses for CC)
- bcc: string (Optional - Email address or addresses for BCC)

**Returns**: Confirmation message

**Example**:
\`\`\`json
{
  "to": "recipient@example.com",
  "subject": "Password Reset",
  "template": {
    "name": "password-reset",
    "data": {
      "url": "https://example.com/reset?token=xyz",
      "user_name": "John Doe"
    }
  }
}
\`\`\`

**Available Templates**:
- user-invitation: For inviting users to the platform
- password-reset: For password reset emails
- user-registration: For new user registrations
`,
	},

	// Folders tools
	{
    uri: 'mcp://docs/tools/folders',
		mimeType: 'text/markdown',
		name: 'Folders Tools',
		description: 'Documentation for folder management tools',
		text: `# Folder Management Tools

## get_folders
Get a list of folders with optional filtering and pagination.

**Parameters**:
- filter: object (Optional - Filter criteria for folders)
- limit: number (Optional - Maximum number of folders to return)
- offset: number (Optional - Number of folders to skip for pagination)
- sort: array (Optional - Sort criteria)

**Returns**: Array of folder objects

**Example**:
\`\`\`json
{
  "filter": {
    "parent": {
      "_null": true
    }
  }
}
\`\`\`

## get_folder
Get details about a specific folder.

**Parameters**:
- id: string (Required - ID of the folder to get)

**Returns**: Folder object

**Example**:
\`\`\`json
{
  "id": "123"
}
\`\`\`

## create_folder
Create a new folder.

**Parameters**:
- name: string (Required - Name of the folder)
- parent: string (Optional - Parent folder ID)

**Returns**: The created folder object

**Example**:
\`\`\`json
{
  "name": "Marketing Materials",
  "parent": "456"
}
\`\`\`

## update_folder
Update an existing folder.

**Parameters**:
- id: string (Required - ID of the folder to update)
- data: object (Required - Folder data to update)

**Returns**: The updated folder object

**Example**:
\`\`\`json
{
  "id": "123",
  "data": {
    "name": "Updated Folder Name"
  }
}
\`\`\`

## delete_folder
Delete a folder.

**Parameters**:
- id: string (Required - ID of the folder to delete)

**Returns**: Confirmation message

**Example**:
\`\`\`json
{
  "id": "123"
}
\`\`\`
`,
	},

	// Response formats
	 {uri: 'mcp://docs/response-formats',
		mimeType: 'text/markdown',
		name: 'Response Formats',
		description: 'Documentation for MCP response formats',
		text: `# MCP Response Formats

All tools in the Directus MCP server follow a consistent response format:

## Success Response
When an operation succeeds, the response will have this format:

\`\`\`json
{
  "content": [
    {
      "type": "json",
      "json": {
        // The actual response data
      }
    }
  ]
}
\`\`\`

For operations that return no data (like deletions), the response will be:

\`\`\`json
{
  "content": [
    {
      "type": "text",
      "text": "Success message"
    }
  ]
}
\`\`\`

## Error Response
When an operation fails, the response will have this format:

\`\`\`json
{
  "content": [
    {
      "type": "error",
      "text": "Error message"
    }
  ]
}
\`\`\`

All errors are logged on the server for troubleshooting.
`,
	},

	// Best practices
	{
    uri: 'mcp://docs/best-practices',
		mimeType: 'text/markdown',
		name: 'MCP Best Practices',
		description: 'Best practices for using the Directus MCP server',
		text: `# Best Practices for Using the Directus MCP Server

## General Guidelines
1. **Start with exploration**: Use get_collections and get_fields to understand the data structure.
2. **Minimize data transfer**: Use filters, limits, and specific field selections when possible.
3. **Error handling**: Always handle potential errors in tool responses.
4. **Pagination**: For large datasets, use limit and offset parameters to paginate results.

## Working with Items
1. **Validate data before creating/updating**: Ensure all required fields are provided.
2. **Use proper filter syntax**: Follow Directus filter syntax for efficient querying.
3. **Handle relationships carefully**: Understand the relationships between collections.

## Working with Files
1. **Check file types**: Verify file types before operations.
2. **Organize with folders**: Use folders to maintain file organization.

## Security Considerations
1. **Respect permissions**: The MCP server respects Directus permissions, so operations are limited by the user's role.
2. **Secure credentials**: Don't expose authentication details.
3. **Validate user input**: Always validate input before passing to tools.

## Performance Tips
1. **Batch operations when possible**: Group related operations.
2. **Cache frequently used data**: Cache results for repeated queries.
3. **Use specific queries**: Request only the data you need.
`,
	},

	// Query Parameters
	{
    uri: 'mcp://docs/query-parameters',
		mimeType: 'text/markdown',
		name: 'Query Parameters',
		description: 'Documentation for Directus query parameters',
		text: `# Directus Query Parameters

Most Directus API endpoints can use global query parameters to customize the data that is returned. These parameters are available in the read_items tool and other tools that support querying.

## Fields
Specify which fields are returned. This parameter also supports dot notation to request nested relational fields, and wildcards (*) to include all fields at a specific depth.

**Examples**:
- \`fields=first_name,last_name\` - Return only the first_name and last_name fields
- \`fields=title,author.name\` - Return title and the related author item's name field
- \`fields=*\` - Return all fields
- \`fields=*.*\` - Return all fields and all immediately related fields
- \`fields=*,images.*\` - Return all fields and all fields within the images relationship

**Note on performance**: While wildcards are very useful, it's recommended to only request specific fields in production. This speeds up the request and reduces the output size.

### Many to Any Fields
For Many to Any (M2A) fields with nested data from multiple collections, use this syntax to specify fields from specific related collections:

\`fields=m2a-field:collection-scope.field\`

**Example**:
In a posts collection with a Many to Any field called 'sections' that points to headings, paragraphs, and videos:

\`\`\`
fields[]=title
fields[]=sections.item:headings.title
fields[]=sections.item:headings.level
fields[]=sections.item:paragraphs.body
fields[]=sections.item:videos.source
\`\`\`

## Filter
Specify which items are returned based on filter rules. 

**Syntax**:
\`\`\`json
{
  "field": {
    "operator": "value"
  }
}
\`\`\`

**Example**:
\`\`\`json
{
  "filter": {
    "title": {
      "_eq": "Hello World"
    }
  }
}
\`\`\`

See the detailed Filter Rules documentation for more information on available operators and advanced filtering.

## Search
Search on all string and text type fields within a collection. It's a convenient way to search without complex filters, though less optimized.

**Example**:
\`search=Directus\`

## Sort
Specify which fields to sort results by. Sorting defaults to ascending, but appending a - reverses this. Fields are prioritized by their order.

**Example**:
\`sort=date_created,-title,author.name\`

## Limit
Set the maximum number of items to return. The default limit is 100. Use -1 to return all items (subject to server configuration).

**Example**:
\`limit=50\`

**Note on performance**: Large limits can result in degraded performance or timeouts.

## Offset
Skip the specified number of items in the response. Used for pagination.

**Example**:
\`offset=100\`

## Page
An alternative to offset for pagination. Page 1 is the first page.

**Example**:
\`page=2\`

## Aggregate
Perform calculations on a set of values, returning a single result.

**Available Functions**:
- count - Counts how many items there are
- countDistinct - Counts how many unique items there are
- sum - Adds together the values in the given field
- sumDistinct - Adds together the unique values in the given field
- avg - Get the average value of the given field
- avgDistinct - Get the average value of the unique values in the given field
- min - Return the lowest value in the field
- max - Return the highest value in the field

**Example**:
\`aggregate[count]=*\`

## GroupBy
Group aggregate functions based on a shared value. You can group by multiple fields simultaneously.

**Example**:
\`\`\`
aggregate[count]=views,comments
groupBy[]=author
groupBy[]=year(publish_date)
\`\`\`

## Deep
Apply query parameters on nested relational datasets. The nested parameters are prefixed with an underscore.

**Example**:
\`\`\`json
{
  "deep": {
    "related_posts": {
      "_limit": 3,
      "_filter": {
        "status": {
          "_eq": "published"
        }
      }
    }
  }
}
\`\`\`

## Alias
Rename fields for the request, and fetch the same nested data multiple times with different filters.

**Example**:
\`\`\`
alias[all_translations]=translations
alias[dutch_translations]=translations
deep[dutch_translations][_filter][code][_eq]=nl-NL
\`\`\`

## Functions
Functions accept a field and return a modified value. They can be used in field selection, aggregation, and filters.

**Syntax**: \`function(field)\`

**Available Functions**:
- year - Extract the year from a datetime field
- month - Extract the month from a datetime field
- week - Extract the week from a datetime field
- day - Extract the day from a datetime field
- weekday - Extract the weekday from a datetime field
- hour - Extract the hour from a datetime field
- minute - Extract the minute from a datetime field
- second - Extract the second from a datetime field
- count - Extract the number of items from a JSON array or relational field

**Example**:
\`\`\`json
{
  "filter": {
    "year(date_published)": {
      "_eq": 2023
    }
  }
}
\`\`\`
`,
	},

	// Filter Rules
	{
    uri: 'mcp://docs/filter-rules',
		mimeType: 'text/markdown',
		name: 'Filter Rules',
		description: 'Documentation for Directus filter rules',
		text: `# Directus Filter Rules

Filters are used throughout Directus to query specific data. They have a consistent syntax and a rich set of operators.

## Available Operators

| Operator | Description |
|----------|-------------|
| _eq | Equals |
| _neq | Doesn't equal |
| _lt | Less than |
| _lte | Less than or equal to |
| _gt | Greater than |
| _gte | Greater than or equal to |
| _in | Is one of the values in array |
| _nin | Is not one of the values in array |
| _null | Is null |
| _nnull | Is not null |
| _contains | Contains (case-sensitive) |
| _icontains | Contains (case-insensitive) |
| _ncontains | Doesn't contain |
| _starts_with | Starts with |
| _istarts_with | Starts with (case-insensitive) |
| _nstarts_with | Doesn't start with |
| _nistarts_with | Doesn't start with (case-insensitive) |
| _ends_with | Ends with |
| _iends_with | Ends with (case-insensitive) |
| _nends_with | Doesn't end with |
| _niends_with | Doesn't end with (case-insensitive) |
| _between | Is between two values (inclusive) |
| _nbetween | Is not between two values (inclusive) |
| _empty | Is empty (null or falsy) |
| _nempty | Is not empty (null or falsy) |

## Filter Syntax

The basic syntax for a filter rule is:

\`\`\`json
{
  "field": {
    "operator": "value"
  }
}
\`\`\`

**Example**:
\`\`\`json
{
  "title": {
    "_contains": "Directus"
  }
}
\`\`\`

## Filtering Relational Fields

### Many-to-One
You can filter items with Many-to-One relations by specifying values of their respective fields.

**Example**:
For an articles collection with a relational Many-to-One author field:

\`\`\`json
{
  "author": {
    "name": {
      "_eq": "John Doe"
    }
  }
}
\`\`\`

### Many-to-Many
For Many-to-Many relationships, filters apply to the junction table.

**Example**:
For a books collection with a Many-to-Many relationship to authors:

\`\`\`json
{
  "authors": {
    "authors_id": {
      "name": {
        "_eq": "John Doe"
      }
    }
  }
}
\`\`\`

### _some vs _none in Relational Fields
The _some operator matches items where at least one related item meets the condition (default behavior).

\`\`\`json
{
  "categories": {
    "_some": {
      "name": {
        "_eq": "Fiction"
      }
    }
  }
}
\`\`\`

The _none operator matches items where none of the related items meet the condition.

\`\`\`json
{
  "categories": {
    "_none": {
      "name": {
        "_eq": "Fiction"
      }
    }
  }
}
\`\`\`

## Dynamic Variables

| Variable | Description |
|----------|-------------|
| $CURRENT_USER | Primary key of the currently authenticated user |
| $CURRENT_ROLE | Primary key of the role for the current user |
| $NOW | Current timestamp |
| $NOW(<adjustment>) | Current timestamp with adjustment, e.g., $NOW(-1 year) |

**Example**:
\`\`\`json
{
  "user_created": {
    "_eq": "$CURRENT_USER"
  }
}
\`\`\`

## Logical Operators
Group multiple rules using _and or _or logical operators.

**Syntax**:
\`\`\`json
{
  "_and": [
    {
      "field1": {
        "operator": "value"
      }
    },
    {
      "field2": {
        "operator": "value"
      }
    }
  ]
}
\`\`\`

**Example**:
\`\`\`json
{
  "_or": [
    {
      "_and": [
        {
          "user_created": {
            "_eq": "$CURRENT_USER"
          }
        },
        {
          "status": {
            "_in": ["published", "draft"]
          }
        }
      ]
    },
    {
      "_and": [
        {
          "user_created": {
            "_neq": "$CURRENT_USER"
          }
        },
        {
          "status": {
            "_in": ["published"]
          }
        }
      ]
    }
  ]
}
\`\`\`

## Function Parameters
Functions in filters modify field values before comparison.

**Syntax**: \`function(field)\`

**Example**:
\`\`\`json
{
  "_and": [
    {
      "year(published_date)": {
        "_eq": 2023
      }
    },
    {
      "month(published_date)": {
        "_eq": 4
      }
    }
  ]
}
\`\`\`

## $FOLLOW Syntax
For querying indirect relations, use $FOLLOW(target-collection, relation-field).

**Example**:
If cities have an M2O relationship with countries via country_id:

\`\`\`json
{
  "filter": {
    "name": "Germany",
    "$FOLLOW(cities, country_id)": {
      "name": "Berlin"
    }
  }
}
\`\`\`
`,
	},
] satisfies Resource[]

// Resource tools decorator for MCP
export class ResourceDecorator extends MCPResourceHandlerDecorator {
	constructor(handler: IMCPResourceHandler) {
		super(handler);
	}

	public override getResources(): Resource[] {
		return [
			...super.getResources(),
			...MCP_RESOURCES,
		];
	}
}
