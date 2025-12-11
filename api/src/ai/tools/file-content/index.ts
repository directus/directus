import { UnsupportedMediaTypeError } from '@directus/errors';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { FilesService } from '../../../services/files.js';
import { getStorage } from '../../../storage/index.js';
import { requireText } from '../../../utils/require-text.js';
import { defineTool } from '../define-tool.js';
import { extractTextFromBuffer } from './lib/extract-text.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DEFAULT_MAX_LENGTH = 50000;
const ABSOLUTE_MAX_LENGTH = 100000;

const FileContentValidateSchema = z.strictObject({
	id: z.string(),
	max_length: z.number().int().positive().max(ABSOLUTE_MAX_LENGTH).optional(),
});

const FileContentInputSchema = z.object({
	id: z.string().describe('The UUID of the file to read content from'),
	max_length: z
		.number()
		.int()
		.positive()
		.max(ABSOLUTE_MAX_LENGTH)
		.optional()
		.describe(`Maximum characters to return (default: ${DEFAULT_MAX_LENGTH}, max: ${ABSOLUTE_MAX_LENGTH})`),
});

// MIME types that we can extract text from
const SUPPORTED_TEXT_TYPES = [
	'application/pdf',
	'text/plain',
	'text/markdown',
	'text/csv',
	'text/html',
	'text/css',
	'text/xml',
	'application/json',
	'application/xml',
	'application/javascript',
	'application/typescript',
	'application/x-yaml',
	'text/yaml',
	'text/x-python',
	'text/x-java',
	'text/x-c',
	'text/x-c++',
	'text/x-csharp',
	'text/x-go',
	'text/x-rust',
	'text/x-ruby',
	'text/x-php',
	'text/x-sql',
	'text/x-shellscript',
];

// File extensions that should be treated as text even if MIME type is generic
const TEXT_EXTENSIONS = [
	'.txt',
	'.md',
	'.markdown',
	'.csv',
	'.json',
	'.xml',
	'.yaml',
	'.yml',
	'.html',
	'.htm',
	'.css',
	'.js',
	'.ts',
	'.jsx',
	'.tsx',
	'.py',
	'.java',
	'.c',
	'.cpp',
	'.h',
	'.hpp',
	'.cs',
	'.go',
	'.rs',
	'.rb',
	'.php',
	'.sql',
	'.sh',
	'.bash',
	'.zsh',
	'.env',
	'.gitignore',
	'.dockerignore',
	'.editorconfig',
	'.prettierrc',
	'.eslintrc',
	'.vue',
	'.svelte',
];

function isTextFile(mimeType: string | null, filename: string): boolean {
	// Check MIME type
	if (mimeType && SUPPORTED_TEXT_TYPES.some((t) => mimeType.startsWith(t.split('/')[0]!) && mimeType.includes(t.split('/')[1]!))) {
		return true;
	}

	if (mimeType?.startsWith('text/')) {
		return true;
	}

	// Check file extension
	const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));

	if (TEXT_EXTENSIONS.includes(ext)) {
		return true;
	}

	// PDF is a special case
	if (mimeType === 'application/pdf') {
		return true;
	}

	return false;
}

export const fileContent = defineTool<z.infer<typeof FileContentValidateSchema>>({
	name: 'file-content',
	description: requireText(resolve(__dirname, './prompt.md')),
	annotations: {
		title: 'Directus - File Content',
	},
	inputSchema: FileContentInputSchema,
	validateSchema: FileContentValidateSchema,
	endpoint({ input }) {
		if (typeof input === 'object' && input !== null && 'id' in input) {
			return ['files', input.id as string];
		}

		return undefined;
	},
	async handler({ args, schema, accountability }) {
		const maxLength = args.max_length ?? DEFAULT_MAX_LENGTH;

		const filesService = new FilesService({
			schema,
			accountability,
		});

		// Get file metadata (respects permissions)
		const file = await filesService.readOne(args.id, {
			fields: ['id', 'storage', 'filename_disk', 'filename_download', 'type', 'filesize'],
		});

		// Validate file type is supported
		if (!isTextFile(file.type, file.filename_download)) {
			throw new UnsupportedMediaTypeError({
				mediaType: file.type ?? 'unknown',
				where: 'file-content tool. Use the assets tool for images and audio files.',
			});
		}

		// Read file from storage
		const storage = await getStorage();
		const fileStream = await storage.location(file.storage).read(file.filename_disk);

		// Collect chunks into a buffer
		const chunks: Buffer[] = [];

		for await (const chunk of fileStream) {
			chunks.push(Buffer.from(chunk));
		}

		const buffer = Buffer.concat(chunks);

		// Extract text based on file type
		const extractedText = await extractTextFromBuffer(buffer, file.type, file.filename_download);

		// Truncate if necessary
		const truncated = extractedText.length > maxLength;
		const content = truncated ? extractedText.slice(0, maxLength) : extractedText;

		return {
			type: 'text',
			data: {
				content,
				filename: file.filename_download,
				type: file.type,
				truncated,
				...(truncated && { original_length: extractedText.length }),
			},
		};
	},
});
