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

### Optional config

Root folder in supabase bucket:

```bash
STORAGE_SUPABASE_ROOT="some/path"
```

## Notes/References

Some inspiration from [this](https://github.com/directus/directus/pull/15631) pull request.

Also, based on [this](https://github.com/directus/directus/discussions/14742#discussion-4262013) discussion, not all
methods of the Directus `Storage` class are implemented.
