import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { generateDirectusTypes } from 'directus-sdk-typegen';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../../'); // Go up two levels to project root

async function generateTypes() {
	const directusUrl = process.env.DIRECTUS_URL;
	const directusToken = process.env.DIRECTUS_SERVER_TOKEN;

	if (!directusUrl || !directusToken) {
		console.error('Error: DIRECTUS_URL or DIRECTUS_SERVER_TOKEN is missing in the .env file.');
		process.exit(1);
	}

	try {
		const outputPath = join(projectRoot, 'nuxt', 'shared', 'types', 'schema.ts');

		// Log the path to help debug in case of errors
		console.log('Attempting to write to:', outputPath);

		await generateDirectusTypes({
			outputPath,
			directusUrl,
			directusToken,
		});
		console.log('Types successfully generated!');
	} catch (error) {
		console.error('Failed to generate types:', error);
		console.error('Current directory:', __dirname);
		console.error('Project root:', projectRoot);
		process.exit(1);
	}
}

generateTypes();
