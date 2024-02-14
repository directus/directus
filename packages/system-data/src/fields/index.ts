import defaults from './_defaults.yaml';

import activityFields from './activity.yaml';
import collectionFields from './collections.yaml';
import fieldFields from './fields.yaml';
import fileFields from './files.yaml';
import folderFields from './folders.yaml';
import migrationFields from './migrations.yaml';
import permissionFields from './permissions.yaml';
import presetFields from './presets.yaml';
import relationFields from './relations.yaml';
import revisionFields from './revisions.yaml';
import roleFields from './roles.yaml';
import sessionFields from './sessions.yaml';
import settingsFields from './settings.yaml';
import userFields from './users.yaml';
import webhookFields from './webhooks.yaml';
import dashboardFields from './dashboards.yaml';
import panelFields from './panels.yaml';
import notificationFields from './notifications.yaml';
import shareFields from './shares.yaml';
import flowFields from './flows.yaml';
import operationFields from './operations.yaml';
import translationFields from './translations.yaml';
import versionFields from './versions.yaml';
import extensionFields from './extensions.yaml';

import { FieldMeta } from '../types.js';

export const systemFieldRows: FieldMeta[] = [];

processFields(activityFields);
processFields(collectionFields);
processFields(fieldFields);
processFields(fileFields);
processFields(folderFields);
processFields(migrationFields);
processFields(permissionFields);
processFields(presetFields);
processFields(relationFields);
processFields(revisionFields);
processFields(roleFields);
processFields(sessionFields);
processFields(settingsFields);
processFields(userFields);
processFields(webhookFields);
processFields(dashboardFields);
processFields(panelFields);
processFields(notificationFields);
processFields(shareFields);
processFields(flowFields);
processFields(operationFields);
processFields(translationFields);
processFields(versionFields);
processFields(extensionFields);

function processFields(systemFields: Record<string, any>) {
	const { fields, table } = systemFields as { fields: FieldMeta[]; table: string };

	fields.forEach((field, index) => {
		systemFieldRows.push({
			system: true,
			...defaults,
			...field,
			collection: table,
			sort: index + 1,
		});
	});
}
