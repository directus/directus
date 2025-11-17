Retrieve base64-encoded file content from Directus. Returns raw file data suitable for AI vision models, image analysis,
and file operations.

**Input**: `{"id": "file-uuid"}`

**Output**: `{"data": "base64-string", "mimeType": "image/jpeg"}`

**Note**: Supports images and audio files. Respects Directus permissions.
