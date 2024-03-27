import { parseJSON } from '@directus/utils';
import type { Knex } from 'knex';

// Change image metadata structure to match the output from 'exifr'
export async function up(knex: Knex): Promise<void> {
	const files = await knex
		.select<{ id: number; metadata: string }[]>('id', 'metadata')
		.from('directus_files')
		.whereNotNull('metadata');

	for (const { id, metadata } of files) {
		let prevMetadata;

		try {
			prevMetadata = parseJSON(metadata);
		} catch {
			continue;
		}

		// Update only required if metadata has 'exif' data
		if (prevMetadata.exif) {
			// Get all data from 'exif' and rename the following keys:
			// - 'image' to 'ifd0'
			// - 'thumbnail to 'ifd1'
			// - 'interoperability' to 'interop'
			const newMetadata = prevMetadata.exif;

			if (newMetadata.image) {
				newMetadata.ifd0 = newMetadata.image;
				delete newMetadata.image;
			}

			if (newMetadata.thumbnail) {
				newMetadata.ifd1 = newMetadata.thumbnail;
				delete newMetadata.thumbnail;
			}

			if (newMetadata.interoperability) {
				newMetadata.interop = newMetadata.interoperability;
				delete newMetadata.interoperability;
			}

			if (prevMetadata.icc) {
				newMetadata.icc = prevMetadata.icc;
			}

			if (prevMetadata.iptc) {
				newMetadata.iptc = prevMetadata.iptc;
			}

			await knex('directus_files')
				.update({ metadata: JSON.stringify(newMetadata) })
				.where({ id });
		}
	}
}

export async function down(knex: Knex): Promise<void> {
	const files = await knex
		.select<{ id: number; metadata: string }[]>('id', 'metadata')
		.from('directus_files')
		.whereNotNull('metadata')
		.whereNot('metadata', '{}');

	for (const { id, metadata } of files) {
		const prevMetadata = parseJSON(metadata);

		// Update only required if metadata has keys other than 'icc' and 'iptc'
		if (Object.keys(prevMetadata).filter((key) => key !== 'icc' && key !== 'iptc').length > 0) {
			// Put all data under 'exif' and rename/move keys afterwards
			const newMetadata: { exif: Record<string, unknown>; icc?: unknown; iptc?: unknown } = { exif: prevMetadata };

			if (newMetadata.exif['ifd0']) {
				newMetadata.exif['image'] = newMetadata.exif['ifd0'];
				delete newMetadata.exif['ifd0'];
			}

			if (newMetadata.exif['ifd1']) {
				newMetadata.exif['thumbnail'] = newMetadata.exif['ifd1'];
				delete newMetadata.exif['ifd1'];
			}

			if (newMetadata.exif['interop']) {
				newMetadata.exif['interoperability'] = newMetadata.exif['interop'];
				delete newMetadata.exif['interop'];
			}

			if (newMetadata.exif['icc']) {
				newMetadata.icc = newMetadata.exif['icc'];
				delete newMetadata.exif['icc'];
			}

			if (newMetadata.exif['iptc']) {
				newMetadata.iptc = newMetadata.exif['iptc'];
				delete newMetadata.exif['iptc'];
			}

			await knex('directus_files')
				.update({ metadata: JSON.stringify(newMetadata) })
				.where({ id });
		}
	}
}
