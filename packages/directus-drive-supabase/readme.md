# directus-drive-supabase

[Supabase Storage](https://supabase.com/storage) storage layer for `@directus/drive`

## Configuration

Requires the following example environment variables:

```bash
# driver must be "supabase"
STORAGE_SUPABASE_DRIVER="supabase"

# url for the supabase *storage api*
STORAGE_SUPABASE_ENDPOINT="http://localhost:54321/storage/v1"

# this is the supabase service key
STORAGE_SUPABASE_SECRET="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSJ9.vI9obAHOGyVVKa3pD--kJlyxp-Z2zV9UUMAhKpNLAcU"

# an existing bucket
STORAGE_SUPABASE_BUCKET="studio"
```

## todo

- [x] add comments in code
- [ ] test if everything is working as expected (manual)
- [ ] improve error handling; throw more specific directus exceptions where appropriate
