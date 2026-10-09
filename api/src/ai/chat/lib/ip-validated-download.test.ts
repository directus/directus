import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { getAxios } from '../../../request/index.js';
import { ipValidatedDownload } from './ip-validated-download.js';

vi.mock('../../../request/index.js');

let get: Mock;

beforeEach(() => {
	get = vi.fn();
	vi.mocked(getAxios).mockResolvedValue({ get } as any);
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('ipValidatedDownload', () => {
	it('passes a model-supported URL through untouched instead of downloading it', async () => {
		// Arrange
		const googleFileUri = new URL('https://generativelanguage.googleapis.com/v1beta/files/abc');

		// Act
		const result = await ipValidatedDownload([{ url: googleFileUri, isUrlSupportedByModel: true }]);

		// Assert
		expect(result).toEqual([null]);
		expect(get).not.toHaveBeenCalled();
	});

	it('downloads an unsupported URL through the IP-validated client and returns its bytes and media type', async () => {
		// Arrange
		get.mockResolvedValue({
			data: new TextEncoder().encode('file-bytes').buffer,
			headers: { 'content-type': 'application/pdf; charset=utf-8' },
		});

		// Act
		const [download] = await ipValidatedDownload([
			{ url: new URL('https://example.com/file.pdf'), isUrlSupportedByModel: false },
		]);

		// Assert
		expect(getAxios).toHaveBeenCalled();

		expect(get).toHaveBeenCalledWith(
			'https://example.com/file.pdf',
			expect.objectContaining({ responseType: 'arraybuffer' }),
		);

		expect(download?.data).toBeInstanceOf(Uint8Array);
		expect(download?.mediaType).toBe('application/pdf');
	});

	it('refuses to download a non-http(s) URL', async () => {
		// Arrange
		const fileUrl = new URL('file:///etc/passwd');

		// Act & Assert
		await expect(ipValidatedDownload([{ url: fileUrl, isUrlSupportedByModel: false }])).rejects.toThrow(
			'Unsupported URL protocol',
		);

		expect(get).not.toHaveBeenCalled();
	});

	it('surfaces the denial when a hostname resolves to a denied internal IP', async () => {
		// Arrange
		const ssrfUrl = new URL('http://127-0-0-1.nip.io:9999/ssrf');
		get.mockRejectedValue(new Error('Requested domain "127-0-0-1.nip.io" resolves to a denied IP address'));

		// Act & Assert
		await expect(ipValidatedDownload([{ url: ssrfUrl, isUrlSupportedByModel: false }])).rejects.toThrow(
			'resolves to a denied IP address',
		);
	});
});
