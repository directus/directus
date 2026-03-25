import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { useEnv } from '@directus/env';
import type { File } from '@directus/types';
import exif, { type GPSInfoTags, type ImageTags, type IopTags, type PhotoTags } from 'exif-reader';
import { type IccProfile, parse as parseIcc } from 'icc';
import { pick } from 'lodash-es';
import { useLogger } from '../../../logger/index.js';
import { getSharpInstance } from '../lib/get-sharp-instance.js';
import { parseIptc, parseXmp } from './parse-image-metadata.js';

const env = useEnv();
const logger = useLogger();

export type Metadata = Partial<Pick<File, 'height' | 'width' | 'description' | 'title' | 'tags' | 'metadata'>>;

export async function getMetadata(
	stream: Readable,
	allowList: string | string[] = env['FILE_METADATA_ALLOW_LIST'] as string[],
): Promise<Metadata> {
	const transformer = getSharpInstance();

	return new Promise((resolve) => {
		pipeline(
			stream,
			transformer.metadata(async (err, sharpMetadata) => {
				if (err) {
					logger.error(err);
					return resolve({});
				}

				const metadata: Metadata = {};

				if (sharpMetadata.orientation && sharpMetadata.orientation >= 5) {
					metadata.height = sharpMetadata.width ?? null;
					metadata.width = sharpMetadata.height ?? null;
				} else {
					metadata.width = sharpMetadata.width ?? null;
					metadata.height = sharpMetadata.height ?? null;
				}

				// Backward-compatible layout as it used to be with 'exifr'
				const fullMetadata: {
					ifd0?: Partial<ImageTags>;
					ifd1?: Partial<ImageTags>;
					exif?: Partial<PhotoTags>;
					gps?: Partial<GPSInfoTags>;
					interop?: Partial<IopTags>;
					icc?: IccProfile;
					iptc?: Record<string, unknown>;
					xmp?: Record<string, unknown>;
				} = {};

				if (sharpMetadata.exif) {
					try {
						const { Image, ThumbnailTags, Iop, GPSInfo, Photo } = exif(sharpMetadata.exif);

						if (Image) {
							fullMetadata.ifd0 = Image;
						}

						if (ThumbnailTags) {
							fullMetadata.ifd1 = ThumbnailTags;
						}

						if (Iop) {
							fullMetadata.interop = Iop;
						}

						if (GPSInfo) {
							fullMetadata.gps = GPSInfo;
						}

						if (Photo) {
							fullMetadata.exif = Photo;
						}
					} catch (err) {
						logger.warn(`Couldn't extract Exif metadata from file`);
						logger.warn(err);
					}
				}

				if (sharpMetadata.icc) {
					try {
						fullMetadata.icc = parseIcc(sharpMetadata.icc);
					} catch (err) {
						logger.warn(`Couldn't extract ICC profile data from file`);
						logger.warn(err);
					}
				}

				if (sharpMetadata.iptc) {
					try {
						fullMetadata.iptc = parseIptc(sharpMetadata.iptc);
					} catch (err) {
						logger.warn(`Couldn't extract IPTC Photo Metadata from file`);
						logger.warn(err);
					}
				}

				if (sharpMetadata.xmp) {
					try {
						fullMetadata.xmp = parseXmp(sharpMetadata.xmp);
					} catch (err) {
						logger.warn(`Couldn't extract XMP data from file`);
						logger.warn(err);
					}
				}

				if (fullMetadata?.iptc?.['caption'] && typeof fullMetadata.iptc['caption'] === 'string') {
					metadata.description = fullMetadata.iptc['caption'];
				}

				if (fullMetadata?.iptc?.['headline'] && typeof fullMetadata.iptc['headline'] === 'string') {
					metadata.title = fullMetadata.iptc['headline'];
				}

				if (fullMetadata?.iptc?.['keywords']) {
					metadata.tags = fullMetadata.iptc['keywords'] as string;
				}

				if (allowList === '*' || allowList?.[0] === '*') {
					metadata.metadata = fullMetadata;
				} else {
					metadata.metadata = pick(fullMetadata, allowList);
				}

				// Fix (incorrectly parsed?) values starting / ending with spaces,
				// limited to one level and string values only
				for (const section of Object.keys(metadata.metadata)) {
					for (const [key, value] of Object.entries(metadata.metadata[section])) {
						if (typeof value === 'string') {
							metadata.metadata[section][key] = value.trim();
						}
					}
				}

				resolve(metadata);
			}),
		);
	});
}
