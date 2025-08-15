# Directus Files Tool

Perform CRUD operations on files.

## ⚙️ Available Actions

- **`create`**: Add new file records
- **`read`**: List/query metadata or get specific items by ID
- **`update`**: Modify existing metadata (title, description, tags, folder)
- **`delete`**: Remove files by keys
- **`import`**: Import a file from a URL and create or update its file data

## 📋 Common Operations

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

### Upload a File via URL

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

```json
{
	"action": "update",
	"data": [
		{
			"id": "file-uuid",
			"title": "New Title",
			"description": "Updated description",
			"tags": ["tag1", "tag2", "category"],
			"folder": "folder-uuid"
		}
	]
}
```

### Set Image Focal Point

```json
{
	"action": "update",
	"keys": ["image-uuid"],
	"data": {
		"focal_point_x": 850,
		"focal_point_y": 420
	}
}
```

Sets the focal point for image cropping - coordinates are in pixels from top-left corner.

## 🔍 Query Parameters

For `read` operations, use query parameters to filter and shape results:

- **`fields`**: Specify which fields to return
- **`filter`**: Filter results (e.g., by type, folder, tags)
- **`sort`**: Order results
- **`limit`/`offset`**: Pagination
- **`search`**: Full-text search in filenames and metadata
- **`deep`**: Include related data

### Common Filters

```json
{
	"query": {
		"filter": {
			"type": { "_starts_with": "image/" }, // Images only
			"folder": { "_eq": "folder-uuid" }, // Specific folder
			"filesize": { "_lt": 5000000 }, // Under 5MB
			"uploaded_on": { "_gte": "$NOW(-7 days)" } // Last week
		}
	}
}
```

## 📊 File Metadata Fields

Common fields available for files:

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

## 🎯 Real-World Use Cases

### Asset Selection for Content

Find appropriate images for articles, pages, or products:

```json
{
	"action": "read",
	"query": {
		"fields": ["id", "title", "description", "tags", "type"],
		"filter": {
			"type": { "_starts_with": "image/" },
			"tags": { "_contains": "customer-support" }
		},
		"search": "help center"
	}
}
```

_Example: "Find images in our asset library related to customer support for our new help center article."_

### Asset Analysis and Organization

Improve asset library organization by analyzing and updating metadata:

1. **First, get images needing organization:**

```json
{
	"action": "read",
	"query": {
		"fields": ["id", "filename_disk", "title", "description"],
		"filter": {
			"folder": { "_eq": "product-photography-folder-id" },
			"description": { "_null": true }
		}
	}
}
```

2. **Analyze image content via Assets tool (get base64 for vision analysis):**

```json
{
	"action": "read",
	"id": "image-uuid-to-analyze"
}
```

3. **Update with descriptive metadata:**

```json
{
	"action": "update",
	"data": [
		{
			"id": "image-uuid",
			"title": "Red leather handbag with gold hardware on white background",
			"description": "Professional product photo of red handbag for e-commerce",
			"tags": ["handbag", "leather", "red", "product-photo", "accessories"]
		}
	]
}
```

### Bulk Asset Cleanup

Transform generic filenames into descriptive metadata:

- `IMG_2847.jpg` → Title: "Red leather handbag product photo"
- Add missing alt text for accessibility
- Apply consistent tagging taxonomy
- Organize into appropriate folders

### Smart Image Cropping with Focal Points

Set focal points to ensure important parts of images are preserved during cropping:

```json
{
	"action": "update",
	"data": {
		"id": "portrait-uuid",
		"focal_point_x": 512, // Center of face at 512px from left
		"focal_point_y": 300 // Eyes at 300px from top
	}
}
```

Focal points ensure that when images are cropped for different aspect ratios (thumbnails, hero images, etc.), the
important subject remains visible. Coordinates are in pixels from the top-left corner of the original image.

### Content-Asset Matching

Find and associate relevant assets with content:

```json
{
	"action": "read",
	"query": {
		"fields": ["id", "title", "type", "width", "height"],
		"filter": {
			"type": { "_starts_with": "image/" },
			"$or": [
				{ "tags": { "_contains": "product" } },
				{ "title": { "_contains": "product" } },
				{ "description": { "_contains": "product" } }
			]
		}
	}
}
```

### Asset Migration and Import

When migrating content between systems:

1. Read existing asset metadata
2. Map to new structure
3. Update with proper categorization
4. Maintain relationships with content

## ⚠️ Important Notes

- **File Upload**: This tool manages metadata only. Use appropriate upload endpoints for actual file uploads
- **Asset Size**: Large files are automatically handled but may impact performance
- **Permissions**: Respects Directus access control - only accessible files are returned
- **File Updates**: Only metadata can be updated, not the actual file content

## 🚨 Common Mistakes to Avoid

1. **Don't** confuse file metadata operations with raw content retrieval
2. **Don't** try to upload files through this tool - it's for metadata management
3. **Don't** attempt to modify file content - only metadata can be updated
4. **Remember** that `keys` expects an array even for single items
5. **Tags must be arrays**: Use `["tag1", "tag2"]` not `"tag1, tag2"`
