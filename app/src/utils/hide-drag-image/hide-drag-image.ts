export default function hideDragImage(dataTransfer: DataTransfer): void {
	const emptyImg = new Image();
	dataTransfer.setDragImage(emptyImg, 0, 0);
}
