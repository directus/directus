import defaults from './_defaults.yaml';

import accessFields from './access.yaml';
import activityFields from './activity.yaml';
import collectionFields from './collections.yaml';
import commentsFields from './comments.yaml';
import dashboardFields from './dashboards.yaml';
import extensionFields from './extensions.yaml';
import fieldFields from './fields.yaml';
import fileFields from './files.yaml';
import flowFields from './flows.yaml';
import folderFields from './folders.yaml';
import migrationFields from './migrations.yaml';
import notificationFields from './notifications.yaml';
import operationFields from './operations.yaml';
import panelFields from './panels.yaml';
import permissionFields from './permissions.yaml';
import policyFields from './policies.yaml';
import presetFields from './presets.yaml';
import relationFields from './relations.yaml';
import revisionFields from './revisions.yaml';
import roleFields from './roles.yaml';
import sessionFields from './sessions.yaml';
import settingsFields from './settings.yaml';
import shareFields from './shares.yaml';
import translationFields from './translations.yaml';
import userFields from './users.yaml';
import versionFields from './versions.yaml';
import webhookFields from './webhooks.yaml';

import { FieldMeta } from '../types.js';

export const systemFieldRows: FieldMeta[] = [];

processFields(accessFields);
processFields(activityFields);
processFields(collectionFields);
processFields(commentsFields);
processFields(dashboardFields);
processFields(extensionFields);
processFields(fieldFields);
processFields(fileFields);
processFields(flowFields);
processFields(folderFields);
processFields(migrationFields);
processFields(notificationFields);
processFields(operationFields);
processFields(panelFields);
processFields(permissionFields);
processFields(policyFields);
processFields(presetFields);
processFields(relationFields);
processFields(revisionFields);
processFields(roleFields);
processFields(sessionFields);
processFields(settingsFields);
processFields(shareFields);
processFields(translationFields);
processFields(userFields);
processFields(versionFields);
processFields(webhookFields);

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
