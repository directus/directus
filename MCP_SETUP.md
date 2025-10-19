# DirectApp MCP Server Setup

This document explains how to connect to the DirectApp Directus instance via Model Context Protocol (MCP).

## Quick Start

1. **Set your Directus token** (choose one method):

   ```bash
   # Option A: Export in current shell
   export DIRECTUS_TOKEN="your_token_here"

   # Option B: Add to ~/.bashrc or ~/.zshrc
   echo 'export DIRECTUS_TOKEN="your_token_here"' >> ~/.bashrc
   source ~/.bashrc

   # Option C: Use the generated token file
   source directus_token.env
   ```

2. **The MCP server is configured** in `.mcp.json`:
   ```json
   {
     "mcpServers": {
       "directapp-dev": {
         "command": "npx",
         "args": [
           "-y",
           "@directus/mcp-server",
           "--url",
           "http://localhost:8055",
           "--token",
           "${DIRECTUS_TOKEN}"
         ]
       }
     }
   }
   ```

## Getting a Token

### Method 1: User Token (Expires in 30 minutes)

```bash
# Quick token for testing
cat > /tmp/login.json <<'EOF'
{"email":"admin@example.com","password":"DevPassword123!"}
EOF

TOKEN=$(curl -s -X POST http://localhost:8055/auth/login \
  -H "Content-Type: application/json" \
  -d @/tmp/login.json | jq -r '.data.access_token')

echo "export DIRECTUS_TOKEN=\"$TOKEN\"" > directus_token.env
source directus_token.env
```

### Method 2: Static Token (Recommended - Never expires)

1. Log into Directus: http://localhost:8055
   - Email: `admin@example.com`
   - Password: `DevPassword123!`

2. Navigate to **Settings → Access Tokens**

3. Click **Create Item** (+ button)

4. Configure the token:
   - **Name:** "MCP Development Token"
   - **Policy:** Select "Administrator Access" policy
   - **User:** Select "Admin User" (optional, for user-specific tokens)

5. Click **Save**

6. Copy the generated token

7. Set the environment variable:
   ```bash
   export DIRECTUS_TOKEN="your_static_token_here"
   ```

## MCP Server Capabilities

Once connected, the MCP server provides access to:

### Collections
- `dealership` - Car dealerships (20 fields)
- `cars` - Vehicle inventory (47 fields)
- `notifications` - System notifications
- `resource_types` - Resource types for booking (7 types)
- `resource_sharing` - Resource sharing configuration
- `resource_capacities` - Daily resource capacity tracking
- `resource_bookings` - Resource booking records

### Available Tools
- `read_items` - Query collections
- `create_item` - Create new records
- `update_item` - Update existing records
- `delete_item` - Delete records
- `get_schema` - Get collection schemas
- `query` - Custom queries with filters

### Example MCP Usage

```typescript
// Query all dealerships
await mcp.read_items({
  collection: "dealership",
  fields: ["id", "dealership_name", "dealership_number", "brand"]
});

// Get cars for a specific dealership
await mcp.read_items({
  collection: "cars",
  filter: {
    dealership_id: { _eq: "dealership-uuid-here" }
  },
  fields: ["vin", "brand", "model", "status"]
});

// Get resource types
await mcp.read_items({
  collection: "resource_types",
  sort: ["name"]
});
```

## Troubleshooting

### "Invalid credentials" error
- Your token may have expired (user tokens expire in 30 min)
- Generate a new token using Method 1 above
- Or create a static token (Method 2) for permanent access

### "Permission denied" error
- Ensure the token has proper permissions
- Admin tokens should have full access
- Check that the policy linked to your token includes the collections you're accessing

### MCP server not found
- Ensure `@directus/mcp-server` is available via npx
- Try: `npx -y @directus/mcp-server --help`

### Connection refused
- Check that Directus is running: `docker ps | grep directapp`
- Verify URL is correct: http://localhost:8055
- Test manually: `curl http://localhost:8055/server/health`

## Development Notes

- **Development URL:** http://localhost:8055
- **Admin Login:** admin@example.com / DevPassword123!
- **Database:** PostgreSQL on localhost:5433
- **Redis:** localhost:6380

## Security Notes

⚠️ **Important:**
- Never commit tokens to git
- `directus_token.env` is in `.gitignore`
- Use static tokens for production
- Rotate tokens regularly
- Use environment-specific tokens (dev/staging/prod)

## Next Steps

After connecting via MCP:
1. Explore the schema: `get_schema("dealership")`
2. Query existing data (currently empty, needs seeding)
3. Test CRUD operations
4. Build MCP tools for common workflows

See **Issue #21** for next step: Seeding dealership data.
