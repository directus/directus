import { hideDragImage } from '@/utils/hide-drag-image';
import { expect, test, vi } from 'vitest';

test('Sets drag image to empty image', () => {
	const dataTransfer = {
		setDragImage: vi.fn() as any,
	} as DataTransfer;

	hideDragImage(dataTransfer);

	expect(dataTransfer.setDragImage).toHaveBeenCalledWith(new Image(), 0, 0);
});
