import Knex from 'knex';

const updates = [
	{
		table: 'directus_fields',
		constraints: [
			{
				column: 'group',
				references: 'directus_fields.id',
				onDelete: 'SET NULL',
			},
		],
	},
	{
		table: 'directus_files',
		constraints: [
			{
				column: 'folder',
				references: 'directus_folders.id',
				onDelete: 'SET NULL',
			},
			{
				column: 'uploaded_by',
				references: 'directus_users.id',
				onDelete: 'SET NULL',
			},
			{
				column: 'modified_by',
				references: 'directus_users.id',
				onDelete: 'SET NULL',
			},
		],
	},
	{
		table: 'directus_folders',
		constraints: [
			{
				column: 'parent',
				references: 'directus_folders.id',
				onDelete: 'CASCADE',
			},
		],
	},
	{
		table: 'directus_permissions',
		constraints: [
			{
				column: 'role',
				references: 'directus_roles.id',
				onDelete: 'CASCADE',
			},
		],
	},
	{
		table: 'directus_presets',
		constraints: [
			{
				column: 'user',
				references: 'directus_users.id',
				onDelete: 'CASCADE',
			},
			{
				column: 'role',
				references: 'directus_roles.id',
				onDelete: 'CASCADE',
			},
		],
	},
	{
		table: 'directus_revisions',
		constraints: [
			{
				column: 'activity',
				references: 'directus_activity.id',
				onDelete: 'CASCADE',
			},
			{
				column: 'parent',
				references: 'directus_revisions.id',
				onDelete: 'SET NULL',
			},
		],
	},
	{
		table: 'directus_sessions',
		constraints: [
			{
				column: 'user',
				references: 'directus_users.id',
				onDelete: 'CASCADE',
			},
		],
	},
	{
		table: 'directus_settings',
		constraints: [
			{
				column: 'project_logo',
				references: 'directus_files.id',
				onDelete: 'SET NULL',
			},
			{
				column: 'public_foreground',
				references: 'directus_files.id',
				onDelete: 'SET NULL',
			},
			{
				column: 'public_background',
				references: 'directus_files.id',
				onDelete: 'SET NULL',
			},
		],
	},
	{
		table: 'directus_users',
		constraints: [
			{
				column: 'role',
				references: 'directus_roles.id',
				onDelete: 'SET NULL',
			},
		],
	},
];

export async function up(knex: Knex) {
	if (knex.client.config.client === 'mssql') {
		knex.schema.raw('ALTER DATABASE [directus] SET RECURSIVE_TRIGGERS ON').then(
			(resolved) => {
				console.log('Enabled Recursive Trigger');
			},
			(rejected) => {
				console.error(rejected);
			}
		);
	}

	for (const update of updates) {
		await knex.schema.alterTable(update.table, (table) => {
			for (const constraint of update.constraints) {
				table.dropForeign([constraint.column]);

				if (knex.client.config.client === 'mssql') {
					table
						.foreign(constraint.column)
						.references(constraint.references)
						.onUpdate('NO ACTION')
						.onDelete('NO ACTION');
					// Cascading actions and set nulls are
					// implemented via trigger
				} else {
					table
						.foreign(constraint.column)
						.references(constraint.references)
						.onUpdate('CASCADE')
						.onDelete(constraint.onDelete);
				}
			}
		});
	}

	for (const update of updates) {
		for (const constraint of update.constraints) {
			var referenced_table = constraint.references.split('.')[0];
			var referenced_column = constraint.references.split('.')[1];

			if (referenced_table == update.table) {
				if (constraint.onDelete == 'CASCADE') {
					console.log(`A Creating Trigger ${update.table}: ${constraint.references} ${constraint.onDelete}`);
					knex.schema
						.raw(
							`
						CREATE TRIGGER dbo.[${referenced_table}_${constraint.column}_trigger] ON dbo.[${referenced_table}]
						INSTEAD OF DELETE
						AS
						BEGIN
							SET NOCOUNT ON;
							WITH cte AS 
							(
								SELECT id FROM dbo.[${referenced_table}] WHERE [id] IN (SELECT d.[id] FROM [deleted] d)
								UNION ALL						
								SELECT c.id FROM dbo.[${referenced_table}] c INNER JOIN cte p ON c.[${constraint.column}] = p.[${referenced_column}]
							)
							UPDATE t 
							SET t.[${constraint.column}] = NULL
							FROM dbo.[${referenced_table}] t
							INNER JOIN cte c ON c.[${referenced_column}] = t.[${referenced_column}]	
						END;	
					`
						)
						.then(
							(ok) => {
								console.log('Trigger Created');
							},
							(error) => {
								console.log(error);
							}
						);
					// knex.schema.raw(`
					// 	CREATE TRIGGER dbo.[${referenced_table}_${constraint.column}_trigger] ON dbo.[${referenced_table}]
					// 	INSTEAD OF DELETE
					// 	AS
					// 	BEGIN
					// 		SET NOCOUNT ON;
					// 		WITH cte AS
					// 		(
					// 			SELECT id FROM dbo.[${referenced_table}]  [id] IN (SELECT d.[id] FROM [deleted] d)
					// 			UNION ALL
					// 			SELECT c.id FROM dbo.[${referenced_table}] c INNER JOIN cte p ON c.[${constraint.column}] = p.[${referenced_column}]
					// 		)
					// 		DELETE t
					// 		FROM dbo.[${referenced_table}] t
					// 		INNER JOIN cte c ON c.[${referenced_column}] = t.[${referenced_column}]
					// 	END;
					// `).then(ok => { console.log(ok); }, error => { console.log(error)});
				}
				if (constraint.onDelete == 'SET NULL') {
					console.log(`B Creating Trigger ${update.table}: ${constraint.references} ${constraint.onDelete}`);
					knex.schema
						.raw(
							`
						CREATE TRIGGER dbo.[${referenced_table}_${constraint.column}_trigger] ON dbo.[${referenced_table}]
						INSTEAD OF DELETE
						AS
						BEGIN
							SET NOCOUNT ON;
							WITH cte AS 
							(
								SELECT id FROM dbo.[${referenced_table}] WHERE [id] IN (SELECT d.[id] FROM [deleted] d)
								UNION ALL						
								SELECT c.id FROM dbo.[${referenced_table}] c INNER JOIN cte p ON c.[${constraint.column}] = p.[${referenced_column}]
							)
							UPDATE t 
							SET t.[${constraint.column}] = NULL
							FROM dbo.[${referenced_table}] t
							INNER JOIN cte c ON c.[${referenced_column}] = t.[${referenced_column}]	
						END;	
					`
						)
						.then(
							(ok) => {
								console.log('Trigger Created');
							},
							(error) => {
								console.log(error);
							}
						);
				}
			}
		}
	}
}

export async function down(knex: Knex) {
	for (const update of updates) {
		await knex.schema.alterTable(update.table, (table) => {
			for (const constraint of update.constraints) {
				table.dropForeign([constraint.column]);

				table.foreign(constraint.column).references(constraint.references).onUpdate('NO ACTION').onDelete('NO ACTION');
			}
		});
	}
}
