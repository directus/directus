/**
 * Set the passed data transfer's drag image to an empty image object of 0x0 size
 */
export function hideDragImage(dataTransfer: DataTransfer): void {
	const emptyImg = new Image();
	dataTransfer.setDragImage(emptyImg, 0, 0);
}
