import { ref } from 'vue';

type UploaderHandler = (file: Record<string, any>) => void;

export function useFileHandler() {
	const fileHandler = ref<UploaderHandler | null>(null);
	const currentPreview = ref<string | null>(null);

	return {
		fileHandler,
		unsetFileHandler,
		setFileHandler,
		handleFile,
		currentPreview,
		setCurrentPreview,
	};

	function setCurrentPreview(url: string | undefined | null) {
		currentPreview.value = url || null;
	}

	function unsetFileHandler() {
		fileHandler.value = null;
		currentPreview.value = null;
	}

	function setFileHandler(handler: UploaderHandler) {
		fileHandler.value = handler;
	}

	function handleFile(event: InputEvent | null) {
		if (fileHandler.value && event) {
			fileHandler.value(event);
		}

		unsetFileHandler();
	}
}
