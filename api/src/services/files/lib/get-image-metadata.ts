import type { File } from '@directus/types';
import { SUPPORTED_IMAGE_METADATA_FORMATS } from '../../../constants.js';
import { getStorage } from '../../../storage/index.js';
import { extractImageMetadata, type Metadata } from '../utils/extract-image-metadata.js';
import type { Readable } from 'stream';

type SourceStorage = {
	storage: { location: string; filename: string };
	streamFn?: never;
};
type SourceStream = {
	storage?: never;
	streamFn: () => Readable;
};
type Source = SourceStorage | SourceStream;

/**
 * Get the image metadata from a file
 */
export async function getImageMetadata(source: Source, data: Partial<File> & Pick<File, 'type'>): Promise<Metadata> {
	const fileMeta: Metadata = {};

	if (data.type && SUPPORTED_IMAGE_METADATA_FORMATS.includes(data.type)) {
		let stream;

		if (source.storage !== undefined) {
			const { location, filename } = source.storage;
			const storage = await getStorage();
			stream = await storage.location(location).read(filename);
		} else {
			stream = source.streamFn();
		}

		const { height, width, description, title, tags, metadata } = await extractImageMetadata(stream);

		// Note that if this is a replace file upload, the below properties are fetched and included in the data above
		// in the `existingFile` variable... so this will ONLY set the values if they're not already set

		if (!data.height && height) {
			fileMeta.height = height;
		}

		if (!data.width && width) {
			fileMeta.width = width;
		}

		if (!data.metadata && metadata) {
			fileMeta.metadata = metadata;
		}

		if (!data.description && description) {
			fileMeta.description = description;
		}

		if (!data.title && title) {
			fileMeta.title = title;
		}

		if (!data.tags && tags) {
			fileMeta.tags = tags;
		}
	}

	return fileMeta;
}
