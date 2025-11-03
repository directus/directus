Perform CRUD operations on files in Directus.

## Actions

- **`read`**: List/query metadata or get specific items by ID
- **`update`**: Modify existing metadata
- **`delete`**: Remove files by keys
- **`import`**: Import a file from a URL and create or update its file data

## Example Operations

### Reading File Metadata

```json
{
	"action": "read",
	"query": {
		"fields": ["id", "title", "type", "filesize", "width", "height"],
		"filter": { "type": { "_starts_with": "image/" } },
		"limit": 10
	}
}
```

### Get Single File Metadata

```json
{
	"action": "read",
	"keys": ["file-uuid-here"]
}
```

### Import a File via URL

```json
{
	"action": "import",
	"data": [
		{
			"url": "file-url",
			"file": {
				"title": "New Title",
				"description": "Updated description",
				"tags": ["tag1", "tag2", "category"],
				"folder": "folder-uuid"
			}
		}
	]
}
```

### Update File Metadata

**Single file:**

```json
{
	"action": "update",
	"keys": ["file-uuid"],
	"data": {
		"title": "New Title",
		"description": "Updated description",
		"tags": ["tag1", "tag2", "category"],
		"folder": "folder-uuid"
	}
}
```

**Batch update:**

```json
{
	"action": "update",
	"data": [
		{ "id": "file-uuid-1", "title": "New Title 1" },
		{ "id": "file-uuid-2", "title": "New Title 2" }
	]
}
```

### Common Filters

```json
{
	"query": {
		"filter": {
			"_and": [
				{ "type": { "_icontains": "/png" } }, // PNG files only
				{ "folder": { "_eq": "folder-uuid" } }, // Specific folder
				{ "filesize": { "_lt": 5000000 } }, // Under 5MB
				{ "uploaded_on": { "_gte": "$NOW(-7 days)" } } // Within last week
			]
		}
	}
}
```

## File Metadata Fields

- `id`: Unique identifier
- `storage`: Storage adapter used
- `filename_disk`: Actual filename on disk
- `filename_download`: Suggested download filename
- `title`: Display title
- `type`: MIME type (e.g., "image/jpeg", "application/pdf")
- `folder`: Parent folder ID
- `uploaded_by`: User who uploaded
- `uploaded_on`: Upload timestamp
- `modified_by`: Last modifier
- `modified_on`: Last modification time
- `filesize`: Size in bytes
- `width`/`height`: Dimensions for images (in pixels)
- `duration`: Length for video/audio
- `description`: File description
- `location`: Geo-location data
- `tags`: Array of tag strings (e.g., ["product", "red", "handbag"])
- `metadata`: Additional metadata object
- `focal_point_x`: Horizontal focal point (in pixels from left edge)
- `focal_point_y`: Vertical focal point (in pixels from top edge)

## Real-World Use Cases

### Asset Selection for Content

Find appropriate images for articles, pages, or products:

_Example: "Find images in our asset library related to customer support for our new help center article."_

```json
{
	"action": "read",
	"query": {
		"fields": ["id", "title", "description", "tags", "type"],
		"search": "help center"
	}
}
```

### Asset Organization & Cleanup

Transform generic files into well-organized, searchable assets:

1. **Find files needing metadata:**

```json
{
	"action": "read",
	"query": {
		"fields": ["id", "filename_disk", "title", "description"],
		"filter": { "description": { "_null": true } }
	}
}
```

2. **Analyze with vision (use `assets` tool for base64):** Get image content for AI analysis

3. **Update with descriptive metadata:**

```json
{
	"action": "update",
	"keys": ["image-uuid"],
	"data": {
		"title": "Red leather handbag product photo",
		"description": "Professional e-commerce photo with white background",
		"tags": ["handbag", "leather", "red", "product-photo", "accessories"],
		"focal_point_x": 512,
		"focal_point_y": 300 // Focal points ensure that when images are cropped for different aspect ratios (thumbnails, hero images, etc.), the important subject remains visible. Coordinates are in pixels from the top-left corner of the original image.
	}
}
```

## Key Points

- **ALWAYS pass data as native objects**, NOT stringified JSON
- **Metadata only**: This tool manages file metadata, not file content or uploads
- **Permissions**: Respects Directus access control
- **Arrays required**: `keys` and `tags` must be arrays: `["item"]` not `"item"`
- **Performance**: Large files handled automatically but may impact performance
