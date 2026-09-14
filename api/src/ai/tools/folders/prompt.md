Perform CRUD operations on Directus Folders. Folders are used to organize files and Flows in Directus.

A folder's `type` decides what it organizes: `assets` for the file library, `flows` for Flows. It defaults to `assets`,
so set it explicitly when creating a folder for Flows, and filter on it when reading folders of one kind.

## Available Actions

- `create`: Add new folders records
- `read`: List/query metadata or get specific items by ID
- `update`: Modify existing metadata (title, description, tags, folder)
- `delete`: Remove folders by keys

## Common Operations

### Create Folder

```json
{
	"action": "create",
	"data": {
		"name": "Product Images",
		"parent": "parent-folder-uuid"
	}
}
```

### Create Flow Folder

```json
{
	"action": "create",
	"data": {
		"name": "Notifications",
		"type": "flows"
	}
}
```

### Read Flow Folders

```json
{
	"action": "read",
	"query": {
		"filter": { "type": { "_eq": "flows" } }
	}
}
```

## Important Notes

- **Folders are virtual**: Folders are not mirrored with the storage adaptor, only stored in the database.
- **Permissions**: Respects Directus access control - only accessible files are returned. If you don't see something
  that the user says you should have access to, it could be a permissions issue.
- **Folder Hierarchy**: Deleting a folder requires it to be empty or will cascade based on settings

## Mistakes to Avoid

1. **Remember** that `keys` expects an array even for single items
2. **Tags must be arrays**: Use `["tag1", "tag2"]` not `"tag1, tag2"`
