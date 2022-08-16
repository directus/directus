import { test, expect, vi } from 'vitest';

import { hideDragImage } from '@/utils/hide-drag-image';

test('Sets drag image to empty image', () => {
	const dataTransfer = {
		setDragImage: vi.fn() as any,
	} as DataTransfer;

	hideDragImage(dataTransfer);

	expect(dataTransfer.setDragImage).toHaveBeenCalledWith(new Image(), 0, 0);
});
