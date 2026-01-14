---
'@directus/api': minor
'@directus/app': patch
---

Added `file-content` AI tool for extracting text from files stored in Directus. Supports PDF text extraction (using pdf-parse) and plain text files (markdown, code, JSON, CSV, etc.). The tool respects file permissions and allows setting a maximum character limit for large files.
