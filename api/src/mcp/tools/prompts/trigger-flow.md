Trigger a flow by ID.

Rules:

- Always call read-flows first and include the FULL flow definition in your reasoning
- Always explicitly check if the flow requires selection (options.requireSelection !== false)
- Always verify the collection is in the flow's collections list
- Always provide a complete data object with all required fields
- NEVER skip providing keys when requireSelection is true or undefined
