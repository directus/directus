import fse from 'fs-extra';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
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
};
