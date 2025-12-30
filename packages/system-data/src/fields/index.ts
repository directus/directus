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
import deploymentFields from './deployment.yaml';
import deploymentProjectsFields from './deployment-projects.yaml';

import type { FieldIndex, FieldMeta } from '../types.js';

export const systemFieldRows: FieldMeta[] = [];
export const systemIndexRows: FieldIndex[] = [];

export function hasSystemIndex(collection: string, field: string): boolean {
	return Boolean(systemIndexRows.find((row) => row.collection === collection && row.field === field));
}

export function isSystemField(collection: string, field: string): boolean {
	if (!collection.startsWith('directus_')) return false;

	return Boolean(systemFieldRows.find((fieldMeta) => fieldMeta.collection === collection && fieldMeta.field === field));
}

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
processFields(deploymentFields);
processFields(deploymentProjectsFields);

function processFields(systemFields: Record<string, any>) {
	const {
		table: collection,
		fields,
		indexed,
	} = systemFields as { table: string; fields: FieldMeta[]; indexed: Pick<FieldIndex, 'field'>[] | undefined };

	fields.forEach((field, index) => {
		systemFieldRows.push({
			system: true,
			...defaults,
			...field,
			collection,
			sort: index + 1,
		});
	});

	if (indexed) {
		indexed.forEach(({ field }) => {
			systemIndexRows.push({
				collection,
				field,
			});
		});
	}
}
