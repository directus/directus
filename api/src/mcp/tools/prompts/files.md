Perform CRUD operations on files and folders, or fetch and return a base64-encoded Directus asset.

### 🗂️ Available Types

- `folder`: Operate on system folders
- `file`: Operate on stored files and file metadata
- `asset`: Retrieve a binary asset stream as base64-encoded image (read-only)

### ⚙️ Available Actions

- `create`: Add one or more folders/files (only for type `folder` or `file`)
- `read`: Fetch one or more folders, files, or a specific asset by ID
- `update`: Modify existing folder or file metadata -`delete`: Remove folders or files by keys

### 🧭 Behavior

#### `folder` / `file` Types

- Uses corresponding service (`FoldersService` or `FilesService`)
- CRUD operations supported
- Accepts `data`, `keys`, and query options (`fields`, `filter`, etc.)

#### `asset` Type

- Only supports `read`
- Requires an `id` parameter (file ID)
- Returns a base64-encoded image stream with `mimeType`

### 📘 Usage Notes

- For `create` and `update`, `data` can be a single object or an array
- `read`supports both key-based and query-based lookups
- `delete` always uses the `keys` parameter
- `asset` reads return a single file stream encoded in base64 (PNG output expected)

### ⚠️ Limitations

- `asset` streaming is read-only
- `asset` only returns image content
- Other binary formats (PDF, video, etc.) are not supported in this mode
