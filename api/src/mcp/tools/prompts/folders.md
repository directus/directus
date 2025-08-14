# Directus Files Tool

Perform CRUD operations on folders.

## ⚙️ Available Actions

- **`create`**: Add new folders records
- **`read`**: List/query metadata or get specific items by ID
- **`update`**: Modify existing metadata (title, description, tags, folder)
- **`delete`**: Remove folders by keys

## 📋 Common Operations

### Organize Files into Folders

```json
{
	"type": "folder",
	"action": "create",
	"data": {
		"name": "Product Images",
		"parent": "parent-folder-uuid"
	}
}
```

## 🔍 Query Parameters

For `read` operations, use query parameters to filter and shape results:

- **`fields`**: Specify which fields to return
- **`filter`**: Filter results (e.g., by type, folder, tags)
- **`sort`**: Order results
- **`limit`/`offset`**: Pagination
- **`search`**: Full-text search in filenames and metadata
- **`deep`**: Include related data

## ⚠️ Important Notes

- **Permissions**: Respects Directus access control - only accessible files are returned
- **Folder Hierarchy**: Deleting a folder requires it to be empty or will cascade based on settings

## 🚨 Common Mistakes to Avoid

1. **Remember** that `keys` expects an array even for single items
2. **Tags must be arrays**: Use `["tag1", "tag2"]` not `"tag1, tag2"`
