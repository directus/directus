to just create the database

npm run cli -- bootstrap

last status ON DELETE CASCADE trigger for some reason not created (knex was not executing the code at all) ALL ok with
ON DELETE SET NULL instead (which is very strange as code is exactly the same)

output:

19:08:17 Γ£¿ Installing Directus system tables... 19:08:17 Γ£¿ Setting up first admin role... 19:08:17 Γ£¿ Adding first
admin user... 19:08:17 Γ£¿ No admin email provided. Defaulting to "admin@example.com" 19:08:17 Γ£¿ No admin password
provided. Defaulting to "YgqudJ9wdGRw" 19:08:17 Γ£¿ Running migrations... Enabled Recursive Trigger B Creating Trigger
directus_fields: directus_fields.id SET NULL A Creating Trigger directus_folders: directus_folders.id CASCADE B Creating
Trigger directus_revisions: directus_revisions.id SET NULL Trigger Created Trigger Created 19:08:18 Γ£¿ Done

but trigger on directus_folder was not created at all. The other two were created fine
