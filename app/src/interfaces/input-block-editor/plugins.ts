import { unexpectedError } from '@/utils/unexpected-error';
import BaseAttachesTool from '@editorjs/attaches';
import { MenuConfig } from '@editorjs/editorjs/types/tools';
import BaseImageTool from '@editorjs/image';
import { useBus } from './bus';

/*
 * This file is a modified version of the attaches and image tool from editorjs to work with the Directus file manager.
 *
 * We include an uploader to directly use Directus file manager, along with a modified version of the attaches and image tools.
 */

class Uploader {
	getCurrentFile: any;
	config: any;
	onUpload: any;
	onError: any;
	constructor({
		config,
		getCurrentFile,
		onUpload,
		onError,
	}: {
		config: any;
		getCurrentFile?: any;
		onUpload: any;
		onError: any;
	}) {
		this.getCurrentFile = getCurrentFile;
		this.config = config;
		this.onUpload = onUpload;
		this.onError = onError;
	}

	async uploadByFile(file: any, { onPreview }: any) {
		try {
			await Promise.all([this.uploadSelectedFile({ onPreview }), onPreview()]);

			if (!this.config.uploader.getUploadFieldElement) return;

			this.config.uploader.getUploadFieldElement().onBrowseSelect({
				target: {
					files: [file],
				},
			});
		} catch (error) {
			unexpectedError(error);
		}
	}

	uploadByUrl(url: string) {
		this.onUpload({
			success: 1,
			file: {
				url: url,
			},
		});
	}

	uploadSelectedFile({ onPreview }: { onPreview: any }) {
		if (this.getCurrentFile) {
			const currentPreview = this.getCurrentFile();

			if (currentPreview) {
				const separator = currentPreview.includes('?') ? '&' : '?';
				this.config.uploader.setCurrentPreview(`${currentPreview}${separator}key=system-large-contain`);
			}
		}

		this.config.uploader.setFileHandler(
			(file: { width: any; height: any; filesize: any; filename_download: string; title: any; id: string }) => {
				if (!file) {
					this.onError({
						success: 0,
						message: this.config.t.no_file_selected,
					});

					return;
				}

				const response = {
					success: 1,
					file: {
						width: file.width,
						height: file.height,
						size: file.filesize,
						name: file.filename_download,
						title: file.title,
						extension: file.filename_download.split('.').pop(),
						fileId: file.id,
						fileURL: this.config.uploader.baseURL + 'files/' + file.id,
						url: this.config.uploader.baseURL + 'assets/' + file.id,
					},
				};

				onPreview(response.file.fileURL);
				this.onUpload(response);
			},
		);
	}
}

export class AttachesTool extends BaseAttachesTool {
	constructor(params: {
		config: { uploader: any };
		block: { save: () => Promise<any> };
		api: { blocks: { update: (arg0: any, arg1: any) => void } };
	}) {
		super(params);

		this.config.uploader = params.config.uploader;

		this.uploader = new Uploader({
			config: this.config,
			onUpload: (response: any) => this.onUpload(response),
			onError: (error: any) => this.uploadingFailed(error),
		});

		this.onUpload = (response: any) => {
			super.onUpload(response);

			params.block.save().then((state) => {
				params.api.blocks.update(state.id, state.data);
			});
		};
	}

	showFileData() {
		super.showFileData();

		if (this.data.file && this.data.file.url) {
			const downloadButton = this.nodes.wrapper.querySelector('a.cdx-attaches__download-button');

			if (downloadButton) {
				const separator = this.data.file.url.includes('?') ? '&' : '?';
				downloadButton.href = `${this.data.file.url}${separator}download`;
			}
		}
	}
}

export class ImageTool extends (BaseImageTool as any) {
	constructor(params: any) {
		super(params);

		this.uploader = new Uploader({
			config: this.config,
			getCurrentFile: () => this.data?.file?.url,
			onUpload: (response: any) => this.onUpload(response),
			onError: (error: any) => this.uploadingFailed(error),
		});
	}

	set image(file: { url?: any }) {
		this._data.file = file || {};
		if (file?.url) this.ui.fillImage(file.url);
	}

	renderSettings() {
		const openImageItem: MenuConfig = {
			icon: '<i>open_in_new</i>',
			title: 'Open Image',
			toggle: false,
			onActivate: () => {
				const bus = useBus();
				bus.emit({ type: 'open-url', payload: this.data.file.fileURL });
			},
		};

		return [openImageItem, ...super.renderSettings()];
	}
}
