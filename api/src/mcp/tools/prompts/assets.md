# Directus Assets Tool

Fetch and return base64-encoded Directus assets.

## 📋 Common Operations

### Get Raw File Content (Base64)

```json
{
	"type": "asset",
	"action": "read",
	"id": "file-uuid-here"
}
```

Returns base64-encoded content with MIME type - useful for image analysis, AI vision tools, or file downloads.

## 🖼️ Asset Content Retrieval

When using `type: "asset"`:

- Returns base64-encoded file content
- Includes MIME type for proper handling
- Suitable for:
  - Image analysis and AI vision tools
  - Displaying images in applications
  - File downloads and transfers
  - Content verification

### Response Format for Assets

```json
{
	"type": "image",
	"data": "base64-encoded-string-here",
	"mimeType": "image/jpeg"
}
```

## 🎯 Real-World Use Cases

### Asset Migration and Import

When migrating content between systems:

1. Read existing asset metadata
2. Map to new structure
3. Update with proper categorization
4. Maintain relationships with content

## ⚠️ Important Notes

- **Asset Size**: Large files are automatically handled but may impact performance
- **Permissions**: Respects Directus access control - only accessible files are returned
- **Asset Type**: While primarily for images, the asset reader can handle any file type that Directus stores

## 🚨 Common Mistakes to Avoid

1. **Remember** that `keys` expects an array even for single items
2. **Tags must be arrays**: Use `["tag1", "tag2"]` not `"tag1, tag2"`
