export default function hideDragImage(dataTransfer: DataTransfer) {
	const emptyImg = new Image();
	dataTransfer.setDragImage(emptyImg, 0, 0);
}
