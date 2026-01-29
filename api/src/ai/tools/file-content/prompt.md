Extract and return the text content from a file stored in Directus.

**Supported file types:**

- **PDF** (`.pdf`) - Extracts text from PDF documents
- **Plain text** (`.txt`, `.md`, `.csv`, `.json`, `.xml`, `.yaml`, `.yml`) - Returns raw content
- **Code files** (`.js`, `.ts`, `.py`, `.html`, `.css`, `.sql`, etc.) - Returns raw content

**Input:**

```json
{
	"id": "file-uuid-here",
	"max_length": 50000
}
```

**Parameters:**

- `id` (required): The UUID of the file to read
- `max_length` (optional): Maximum characters to return (default: 50000, max: 100000)

**Output:**

```json
{
	"content": "extracted text content...",
	"filename": "document.pdf",
	"type": "application/pdf",
	"truncated": false
}
```

**Notes:**

- Large files will be truncated to `max_length` characters
- Scanned PDFs (image-based) may return empty or minimal text
- Binary files (images, audio, video, etc.) are not supported - use the `assets` tool instead
- Respects Directus file permissions
