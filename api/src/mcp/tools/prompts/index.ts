import fse from 'fs-extra';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
	// Legacy exports for backward compatibility
	assets: fse.readFileSync(join(__dirname, 'assets.md'), 'utf8'),
	collections: fse.readFileSync(join(__dirname, 'collections.md'), 'utf8'),
	fields: fse.readFileSync(join(__dirname, 'fields.md'), 'utf8'),
	files: fse.readFileSync(join(__dirname, 'files.md'), 'utf8'),
	folders: fse.readFileSync(join(__dirname, 'folders.md'), 'utf8'),
	flows: fse.readFileSync(join(__dirname, 'flows.md'), 'utf8'),
	items: fse.readFileSync(join(__dirname, 'items.md'), 'utf8'),
	operations: fse.readFileSync(join(__dirname, 'operations.md'), 'utf8'),
	relations: fse.readFileSync(join(__dirname, 'relations.md'), 'utf8'),
	schema: fse.readFileSync(join(__dirname, 'schema.md'), 'utf8'),
	systemPrompt: fse.readFileSync(join(__dirname, 'system-prompt.md'), 'utf8'),
	systemPromptDescription: fse.readFileSync(join(__dirname, 'system-prompt-description.md'), 'utf8'),
	triggerFlow: fse.readFileSync(join(__dirname, 'trigger-flow.md'), 'utf8'),

	// Brief versions (for initial load)
	assetsBrief: fse.readFileSync(join(__dirname, 'assets-brief.md'), 'utf8'),
	collectionsBrief: fse.readFileSync(join(__dirname, 'collections-brief.md'), 'utf8'),
	fieldsBrief: fse.readFileSync(join(__dirname, 'fields-brief.md'), 'utf8'),
	filesBrief: fse.readFileSync(join(__dirname, 'files-brief.md'), 'utf8'),
	foldersBrief: fse.readFileSync(join(__dirname, 'folders-brief.md'), 'utf8'),
	flowsBrief: fse.readFileSync(join(__dirname, 'flows-brief.md'), 'utf8'),
	itemsBrief: fse.readFileSync(join(__dirname, 'items-brief.md'), 'utf8'),
	operationsBrief: fse.readFileSync(join(__dirname, 'operations-brief.md'), 'utf8'),
	relationsBrief: fse.readFileSync(join(__dirname, 'relations-brief.md'), 'utf8'),
	schemaBrief: fse.readFileSync(join(__dirname, 'schema-brief.md'), 'utf8'),
	triggerFlowBrief: fse.readFileSync(join(__dirname, 'trigger-flow-brief.md'), 'utf8'),
	toolInfoBrief: fse.readFileSync(join(__dirname, 'tool-info.md'), 'utf8'),

	// Detailed versions (for tool-info tool)
	assetsDetailed: fse.readFileSync(join(__dirname, 'assets.md'), 'utf8'),
	collectionsDetailed: fse.readFileSync(join(__dirname, 'collections.md'), 'utf8'),
	fieldsDetailed: fse.readFileSync(join(__dirname, 'fields.md'), 'utf8'),
	filesDetailed: fse.readFileSync(join(__dirname, 'files.md'), 'utf8'),
	foldersDetailed: fse.readFileSync(join(__dirname, 'folders.md'), 'utf8'),
	flowsDetailed: fse.readFileSync(join(__dirname, 'flows.md'), 'utf8'),
	itemsDetailed: fse.readFileSync(join(__dirname, 'items.md'), 'utf8'),
	operationsDetailed: fse.readFileSync(join(__dirname, 'operations.md'), 'utf8'),
	relationsDetailed: fse.readFileSync(join(__dirname, 'relations.md'), 'utf8'),
	schemaDetailed: fse.readFileSync(join(__dirname, 'schema.md'), 'utf8'),
	triggerFlowDetailed: fse.readFileSync(join(__dirname, 'trigger-flow.md'), 'utf8'),
};
