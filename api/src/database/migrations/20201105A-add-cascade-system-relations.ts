import Knex from 'knex';
import logger from '../../logger';

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
		await enableRecursiveTriggersOnMssql(knex);
	}

	for (const update of updates) {
		await knex.schema.alterTable(update.table, (table) => {
			for (const constraint of update.constraints) {
				table.dropForeign([constraint.column]);

				if (knex.client.config.client === 'mssql') {
					// No actions on foreign keys with mssql because of issues with multiple cascading paths.
					// Resorting to triggers (see further)
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

	if (knex.client.config.client === 'mssql') {
		// Create triggers on mssql for foreign key actions
		await createForeignKeyTriggersOnMssql(knex, updates);
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

async function enableRecursiveTriggersOnMssql(knex: Knex) {
	return knex.schema.raw(`ALTER DATABASE [${knex.client.config.connection.database}] SET RECURSIVE_TRIGGERS ON`).then(
		() => {
			logger.info('Enabled Recursive Triggers on mssql');
		},
		(rejected) => {
			logger.error(rejected);
		}
	);
}

async function createForeignKeyTriggersOnMssql(knex: Knex, updates: any[]) {
	// First group the constraints by referenced table and field.
	// We can only create one INSTEAD OF trigger per table.
	var constraintsByReferencedTables = groupUpdatesByReferencedTable(updates);

	for (const constraintsByReferencedTable of constraintsByReferencedTables) {
		const { referencedTable, referenceColumn, constraints } = constraintsByReferencedTable;

		const constraintsToSelf = constraints.filter((c: any) => c.table === referencedTable);
		const constraintsToOthers = constraints.filter((c: any) => c.table !== referencedTable);

		let triggerActions = '';
		if (constraintsToSelf.length > 0) {
			// Assuming only one foreign key to self, otherwise things get even more complicated.
			const constraintToSelf = constraintsToSelf[0];

			let actionsOnOtherTables = '';
			for (const constraintToOther of constraintsToOthers) {
				if (constraintToOther.onDelete === 'CASCADE') {
					actionsOnOtherTables += `
						DELETE [${constraintToOther.table}]
						WHERE CAST([${constraintToOther.column}] AS nvarchar) IN (SELECT [${referenceColumn}] FROM @deletions)
					`;
				} else {
					actionsOnOtherTables += `
						UPDATE [${constraintToOther.table}]
						SET [${constraintToOther.column}] = NULL
						WHERE CAST([${constraintToOther.column}] AS nvarchar) IN (SELECT [${referenceColumn}] FROM @deletions)
					`;
				}
			}

			const actionOnSelf =
				constraintToSelf.onDelete === 'CASCADE'
					? `DELETE [${referencedTable}] WHERE CAST([${referenceColumn}] AS nvarchar) in (SELECT [${referenceColumn}] from @deletions);`
					: `	UPDATE r
					SET r.[${constraintToSelf.column}] = NULL
					FROM [${referencedTable}] r
						INNER JOIN @deletions d ON (d.[${referenceColumn}] = CAST(r.[${referenceColumn}] AS nvarchar)
							AND r.[${referenceColumn}] <> (SELECT [${referenceColumn}] FROM deleted))
					DELETE [${referencedTable}]
					WHERE [${referenceColumn}] = (SELECT [${referenceColumn}] FROM deleted)
				`;

			triggerActions = `
				declare @deletions table ([${referenceColumn}] nvarchar not null);
				WITH cte as (
					SELECT [${referenceColumn}] from deleted
					UNION ALL
					SELECT r.[${referenceColumn}]
					FROM [${referencedTable}] r
						INNER JOIN cte c ON r.[${constraintToSelf.column}] = c.[${referenceColumn}]
				)
				INSERT INTO @deletions([${referenceColumn}])
				SELECT CAST([${referenceColumn}] AS nvarchar) from cte

				${actionsOnOtherTables}

				${actionOnSelf}
			`;
		} else {
			let actionsOnOtherTables = '';
			for (const constraintToOther of constraintsToOthers) {
				if (constraintToOther.onDelete === 'CASCADE') {
					actionsOnOtherTables += `
						DELETE [${constraintToOther.table}]
						WHERE [${constraintToOther.column}] = (SELECT [${referenceColumn}] FROM deleted)
					`;
				} else {
					actionsOnOtherTables += `
						UPDATE [${constraintToOther.table}]
						SET [${constraintToOther.column}] = NULL
						WHERE [${constraintToOther.column}] = (SELECT [${referenceColumn}] FROM deleted)
					`;
				}
			}

			triggerActions = `
				${actionsOnOtherTables}

				DELETE [${referencedTable}]
				WHERE [${referenceColumn}] = (SELECT [${referenceColumn}] FROM deleted)
			`;
		}

		const triggerName = `tr_iod_${referencedTable}_${referenceColumn}`;
		const triggerString = `
			CREATE TRIGGER [${triggerName}] ON [${referencedTable}]
			INSTEAD OF DELETE
			AS
			BEGIN
				SET NOCOUNT ON
				${triggerActions}
			END;
		`;

		logger.info(`Creating trigger ${triggerName}`);

		await knex.schema.raw(triggerString).then(
			(ok) => {
				logger.info('Trigger Created');
			},
			(error) => {
				logger.error(error);
			}
		);
	}
}

function groupUpdatesByReferencedTable(updates: any[]) {
	const referencedTablesIndexed: any = {};
	const referencedTables: any[] = [];

	for (const update of updates) {
		for (const constraint of update.constraints) {
			if (!referencedTablesIndexed[constraint.references]) {
				const [referencedTable, referenceColumn] = constraint.references.split('.');
				referencedTablesIndexed[constraint.references] = {
					referencedTable: referencedTable,
					referenceColumn: referenceColumn,
					constraints: [],
				};
				referencedTables.push(referencedTablesIndexed[constraint.references]);
			}

			referencedTablesIndexed[constraint.references].constraints.push({
				table: update.table,
				column: constraint.column,
				onDelete: constraint.onDelete,
			});
		}
	}
	return referencedTables;
}
