import { useEnv } from '@directus/env';
import type { File } from '@directus/types';
import exif, { type GPSInfoTags, type ImageTags, type IopTags, type PhotoTags } from 'exif-reader';
import { type IccProfile, parse as parseIcc } from 'icc';
import { pick } from 'lodash-es';
import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { useLogger } from '../../../logger/index.js';
import { getSharpInstance } from '../lib/get-sharp-instance.js';
import { parseIptc, parseXmp } from './parse-image-metadata.js';
import ffmpeg, { type FfprobeStream } from 'fluent-ffmpeg';

const env = useEnv();
const logger = useLogger();

export type Metadata = Partial<
	Pick<File, 'height' | 'width' | 'duration' | 'description' | 'title' | 'tags' | 'metadata'>
>;

export async function getMetadata(
	stream: Readable,
	type: string,
	allowList: string | string[] = env['FILE_METADATA_ALLOW_LIST'] as string[],
): Promise<Metadata> {
	if (type.startsWith('image/')) return getImageMetadata(stream, allowList);
	else return getMediaMetadata(stream, allowList);
}

async function getImageMetadata(stream: Readable, allowList: string | string[]): Promise<Metadata> {
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
						const { Image, ThumbnailTags, Iop, GPSInfo, Photo } = (exif as unknown as typeof exif.default)(
							sharpMetadata.exif,
						);

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

				if (fullMetadata?.iptc?.['Caption'] && typeof fullMetadata.iptc['Caption'] === 'string') {
					metadata.description = fullMetadata.iptc?.['Caption'];
				}

				if (fullMetadata?.iptc?.['Headline'] && typeof fullMetadata.iptc['Headline'] === 'string') {
					metadata.title = fullMetadata.iptc['Headline'];
				}

				if (fullMetadata?.iptc?.['Keywords']) {
					metadata.tags = fullMetadata.iptc['Keywords'] as string;
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

/**
 * Lowercase properties on an object.
 */
function lowercaseProps<T extends Record<string, any>>(obj?: T): T {
	const result: Record<string, any> = {};

	if (obj) {
		for (const [prop, value] of Object.entries(obj)) {
			result[prop.toLowerCase()] = value;
		}
	}

	return result as T;
}

async function getMediaMetadata(stream: Readable, allowList: string | string[]): Promise<Metadata> {
	return new Promise((resolve) => {
		ffmpeg.ffprobe(
			// @ts-expect-error 2345
			stream,
			(err, probeData) => {
				if (err) {
					logger.error(err);
					return resolve({});
				}

				const metadata: Metadata = {};

				const { duration, tags } = probeData.format;
				if (duration) metadata.duration = Math.round(duration * 1000);

				const formatTags = lowercaseProps(tags);
				if (formatTags['title']) metadata.title = `${formatTags['title']}`;

				if (formatTags['comment']) {
					metadata.description = `${formatTags['comment']}`;
				} else if (formatTags['comments']) {
					metadata.description = `${formatTags['comments']}`;
				}

				let stream: FfprobeStream | null = null;

				for (const item of probeData.streams) {
					if (item.codec_type !== 'video') continue; // Only use the first video stream

					if (typeof item.width === 'number' && typeof item.height === 'number') {
						metadata.width = item.width;
						metadata.height = item.height;
						stream = item;
						break;
					}
				}

				const _metadata = { ...probeData, stream };

				if (allowList === '*' || allowList?.[0] === '*') {
					metadata.metadata = _metadata;
				} else {
					metadata.metadata = pick(_metadata, allowList);
				}

				resolve(metadata);
			},
		);
	});
}
