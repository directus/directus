Perform CRUD operations on Directus Flows.

### ⚠️ CRITICAL: Data Parameter Format

The 'data' parameter MUST be passed as a native JavaScript object or array, NOT as a stringified JSON string. Passing
stringified JSON will cause validation errors.

**Correct:** \`"data": {"name": "My Flow", "trigger": "manual"}\` **Incorrect:** \`"data": "{\\"name\\": \\"My Flow\\",
\\"trigger\\": \\"manual\\"}"\`

### 🔄 Flow Properties

- **name** (string) - The name of the flow
- **icon** (string, optional) - Icon displayed in the Admin App
- **color** (string, optional) - Color of the icon in the Admin App
- **description** (string, optional) - Description of the flow
- **status** (string) - Current status: 'active' or 'inactive' (defaults to 'active')
- **trigger** (string) - Type of trigger: 'event', 'webhook', 'operation', 'schedule', or 'manual'
- **accountability** (string, optional) - Permission scope: '$public', '$trigger', '$full', or UUID of a role
- **options** (object, optional) - Options for the selected trigger
- **operation** (string, optional) - UUID of the operation connected to the trigger

### 📝 Usage Examples

**Create Flow:** \`\`\`json { "name": "Article Notification Flow", "trigger": "event", "status": "active",
"description": "Sends notifications when articles are published", "icon": "notifications", "color": "#4CAF50",
"accountability": "$trigger" } \`\`\`

**Update Flow:** \`\`\`json { "status": "inactive", "description": "Updated description" } \`\`\`

### ⚠️ Important Notes

- For create operations, only 'name' and 'trigger' are required; other properties are optional
- For update operations, provide only the fields you want to change
- Always pass data in its native format to avoid validation errors
- Use 'key' parameter for single item operations (read, update, delete)
- Supports all standard Directus query parameters (fields, filter, sort, limit, offset)
