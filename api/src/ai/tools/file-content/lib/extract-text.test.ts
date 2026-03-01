import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { extractTextFromBuffer } from './extract-text.js';

// Mock pdf-parse module
vi.mock('pdf-parse', () => ({
	PDFParse: vi.fn(),
}));

describe('extractTextFromBuffer', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('PDF extraction', () => {
		test('should extract text from PDF buffer', async () => {
			const { PDFParse } = await import('pdf-parse');
			const mockPdfText = 'This is extracted PDF text content';

			const mockTextResult = {
				text: mockPdfText,
				pages: [{ text: mockPdfText, num: 1 }],
				total: 1,
			};

			vi.mocked(PDFParse).mockImplementation(
				() =>
					({
						getText: vi.fn().mockResolvedValue(mockTextResult),
					}) as any,
			);

			const buffer = Buffer.from('mock pdf bytes');
			const result = await extractTextFromBuffer(buffer, 'application/pdf', 'document.pdf');

			expect(result).toBe(mockPdfText);
		});

		test('should extract text from PDF by file extension', async () => {
			const { PDFParse } = await import('pdf-parse');
			const mockPdfText = 'PDF content by extension';

			const mockTextResult = {
				text: mockPdfText,
				pages: [{ text: mockPdfText, num: 1 }],
				total: 1,
			};

			vi.mocked(PDFParse).mockImplementation(
				() =>
					({
						getText: vi.fn().mockResolvedValue(mockTextResult),
					}) as any,
			);

			const buffer = Buffer.from('mock pdf bytes');
			// Even with unknown MIME type, should detect PDF by extension
			const result = await extractTextFromBuffer(buffer, 'application/octet-stream', 'document.pdf');

			expect(result).toBe(mockPdfText);
		});

		test('should throw error when PDF parsing fails', async () => {
			const { PDFParse } = await import('pdf-parse');

			vi.mocked(PDFParse).mockImplementation(
				() =>
					({
						getText: vi.fn().mockRejectedValue(new Error('Invalid PDF structure')),
					}) as any,
			);

			const buffer = Buffer.from('invalid pdf bytes');

			await expect(extractTextFromBuffer(buffer, 'application/pdf', 'broken.pdf')).rejects.toThrow(
				'Failed to extract text from PDF: Invalid PDF structure',
			);
		});
	});

	describe('Text file extraction', () => {
		test('should return text content as-is for plain text files', async () => {
			const textContent = 'Hello, this is plain text content!';
			const buffer = Buffer.from(textContent);

			const result = await extractTextFromBuffer(buffer, 'text/plain', 'readme.txt');

			expect(result).toBe(textContent);
		});

		test('should handle UTF-8 encoded text', async () => {
			const textContent = 'Unicode: 日本語 中文 한국어 émojis: 🎉🚀';
			const buffer = Buffer.from(textContent, 'utf-8');

			const result = await extractTextFromBuffer(buffer, 'text/plain', 'unicode.txt');

			expect(result).toBe(textContent);
		});

		test('should extract content from JSON files', async () => {
			const jsonContent = '{"name": "test", "value": 123}';
			const buffer = Buffer.from(jsonContent);

			const result = await extractTextFromBuffer(buffer, 'application/json', 'data.json');

			expect(result).toBe(jsonContent);
		});

		test('should extract content from markdown files', async () => {
			const mdContent = '# Heading\n\nThis is **markdown** content.';
			const buffer = Buffer.from(mdContent);

			const result = await extractTextFromBuffer(buffer, 'text/markdown', 'readme.md');

			expect(result).toBe(mdContent);
		});

		test('should extract content from code files', async () => {
			const jsContent = 'const hello = () => console.log("Hello!");';
			const buffer = Buffer.from(jsContent);

			const result = await extractTextFromBuffer(buffer, 'application/javascript', 'script.js');

			expect(result).toBe(jsContent);
		});
	});
});
