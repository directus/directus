import { expect, test, vi } from 'vitest';
import { getDroppedFiles } from '@/utils/get-dropped-files';

function mockItem(file: File | null, entry: { isFile: boolean; isDirectory: boolean } | null) {
	return {
		kind: 'file',
		getAsFile: vi.fn(() => file),
		webkitGetAsEntry: vi.fn(() => entry),
	} as unknown as DataTransferItem;
}

function mockDataTransfer(items: DataTransferItem[], files: File[]) {
	return { items, files } as unknown as DataTransfer;
}

const fileEntry = { isFile: true, isDirectory: false };
const directoryEntry = { isFile: false, isDirectory: true };

test('Keeps files without a mime type', () => {
	const file = new File([''], 'rstadvancedsamplefamily.rfa', { type: '' });

	const files = getDroppedFiles(mockDataTransfer([mockItem(file, fileEntry)], [file]));

	expect(files).toEqual([file]);
});

test('Discards directories', () => {
	const file = new File([''], 'image.png', { type: 'image/png' });
	const directory = new File([''], 'folder', { type: '' });

	const files = getDroppedFiles(
		mockDataTransfer([mockItem(directory, directoryEntry), mockItem(file, fileEntry)], [directory, file]),
	);

	expect(files).toEqual([file]);
});

test('Ignores items that are not files', () => {
	const file = new File([''], 'image.png', { type: 'image/png' });

	const stringItem = {
		kind: 'string',
		getAsFile: () => null,
		webkitGetAsEntry: () => null,
	} as unknown as DataTransferItem;

	const files = getDroppedFiles(mockDataTransfer([stringItem, mockItem(file, fileEntry)], [file]));

	expect(files).toEqual([file]);
});

test('Keeps files when the entry cannot be resolved', () => {
	const file = new File([''], 'archive.rfa', { type: '' });

	const files = getDroppedFiles(mockDataTransfer([mockItem(file, null)], [file]));

	expect(files).toEqual([file]);
});

test('Falls back to the file list when items are unavailable', () => {
	const file = new File([''], 'archive.rfa', { type: '' });

	const files = getDroppedFiles(mockDataTransfer([], [file]));

	expect(files).toEqual([file]);
});
