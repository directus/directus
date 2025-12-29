import { PDFParse } from 'pdf-parse';

/**
 * Extract text content from a file buffer based on its MIME type
 */
export async function extractTextFromBuffer(
	buffer: Buffer,
	mimeType: string | null,
	filename: string,
): Promise<string> {
	// Handle PDF files
	if (mimeType === 'application/pdf' || filename.toLowerCase().endsWith('.pdf')) {
		return extractTextFromPdf(buffer);
	}

	// Handle text-based files - just decode as UTF-8
	return buffer.toString('utf-8');
}

/**
 * Extract text from a PDF buffer using pdf-parse
 */
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
	try {
		const parser = new PDFParse({ data: buffer });
		const result = await parser.getText();

		// Return the combined text from all pages
		return result.text;
	} catch (error) {
		// If PDF parsing fails, return an error message
		const message = error instanceof Error ? error.message : 'Unknown error';
		throw new Error(`Failed to extract text from PDF: ${message}`);
	}
}
