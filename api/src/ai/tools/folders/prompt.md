Perform CRUD operations on Directus Folders. Folders are used to organize files in Directus.

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

## Important Notes

- **Folders are virtual**: Folders are not mirrored with the storage adaptor, only stored in the database.
- **Permissions**: Respects Directus access control - only accessible files are returned. If you don't see something
  that the user says you should have access to, it could be a permissions issue.
- **Folder Hierarchy**: Deleting a folder requires it to be empty or will cascade based on settings

## Mistakes to Avoid

1. **Remember** that `keys` expects an array even for single items
2. **Tags must be arrays**: Use `["tag1", "tag2"]` not `"tag1, tag2"`
