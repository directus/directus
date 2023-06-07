import type { Range } from '@directus/storage';
import { parseJSON } from '@directus/utils';
import contentDisposition from 'content-disposition';
import { Router } from 'express';
import { merge, pick } from 'lodash-es';
import { ASSET_TRANSFORM_QUERY_KEYS, SYSTEM_ASSET_ALLOW_LIST } from '../constants.js';
import getDatabase from '../database/index.js';
import env from '../env.js';
import { InvalidQueryException, RangeNotSatisfiableException } from '../exceptions/index.js';
import logger from '../logger.js';
import useCollection from '../middleware/use-collection.js';
import { AssetsService } from '../services/assets.js';
import { PayloadService } from '../services/payload.js';
import type { TransformationFormat, TransformationParams } from '../types/assets.js';
import { TransformationMethods } from '../types/assets.js';
import asyncHandler from '../utils/async-handler.js';
import { getCacheControlHeader } from '../utils/get-cache-headers.js';
import { getConfigFromEnv } from '../utils/get-config-from-env.js';
import { getMilliseconds } from '../utils/get-milliseconds.js';

const router = Router();

router.use(useCollection('directus_files'));

router.get(
	'/:pk/:filename?',
	// Validate query params
	asyncHandler(async (req, res, next) => {
		const payloadService = new PayloadService('directus_settings', { schema: req.schema });
		const defaults = { storage_asset_presets: [], storage_asset_transform: 'all' };

		const database = getDatabase();

		const savedAssetSettings = await database
			.select('storage_asset_presets', 'storage_asset_transform')
			.from('directus_settings')
			.first();

		if (savedAssetSettings) {
			await payloadService.processValues('read', savedAssetSettings);
		}

		const assetSettings = savedAssetSettings || defaults;

		const transformation = pick(req.query, ASSET_TRANSFORM_QUERY_KEYS);

		if ('key' in transformation && Object.keys(transformation).length > 1) {
			throw new InvalidQueryException(`You can't combine the "key" query parameter with any other transformation.`);
		}

		if ('transforms' in transformation) {
			let transforms: unknown;

			// Try parse the JSON array
			try {
				transforms = parseJSON(transformation['transforms'] as string);
			} catch {
				throw new InvalidQueryException(`"transforms" Parameter needs to be a JSON array of allowed transformations.`);
			}

			// Check if it is actually an array.
			if (!Array.isArray(transforms)) {
				throw new InvalidQueryException(`"transforms" Parameter needs to be a JSON array of allowed transformations.`);
			}

			// Check against ASSETS_TRANSFORM_MAX_OPERATIONS
			if (transforms.length > Number(env['ASSETS_TRANSFORM_MAX_OPERATIONS'])) {
				throw new InvalidQueryException(
					`"transforms" Parameter is only allowed ${env['ASSETS_TRANSFORM_MAX_OPERATIONS']} transformations.`
				);
			}

			// Check the transformations are valid
			transforms.forEach((transform) => {
				const name = transform[0];

				if (!TransformationMethods.includes(name)) {
					throw new InvalidQueryException(`"transforms" Parameter does not allow "${name}" as a transformation.`);
				}
			});

			transformation['transforms'] = transforms;
		}

		const systemKeys = SYSTEM_ASSET_ALLOW_LIST.map((transformation) => transformation['key']!);

		const allKeys: string[] = [
			...systemKeys,
			...(assetSettings.storage_asset_presets || []).map(
				(transformation: TransformationParams) => transformation['key']
			),
		];

		// For use in the next request handler
		res.locals['shortcuts'] = [...SYSTEM_ASSET_ALLOW_LIST, ...(assetSettings.storage_asset_presets || [])];
		res.locals['transformation'] = transformation;

		if (
			Object.keys(transformation).length === 0 ||
			('transforms' in transformation && transformation['transforms']!.length === 0)
		) {
			return next();
		}

		if (assetSettings.storage_asset_transform === 'all') {
			if (transformation['key'] && allKeys.includes(transformation['key'] as string) === false) {
				throw new InvalidQueryException(`Key "${transformation['key']}" isn't configured.`);
			}

			return next();
		} else if (assetSettings.storage_asset_transform === 'presets') {
			if (allKeys.includes(transformation['key'] as string)) return next();
			throw new InvalidQueryException(`Only configured presets can be used in asset generation.`);
		} else {
			if (transformation['key'] && systemKeys.includes(transformation['key'] as string)) return next();
			throw new InvalidQueryException(`Dynamic asset generation has been disabled for this project.`);
		}
	}),

	asyncHandler(async (req, res, next) => {
		const helmet = await import('helmet');

		return helmet.contentSecurityPolicy(
			merge(
				{
					useDefaults: false,
					directives: {
						defaultSrc: ['none'],
					},
				},
				getConfigFromEnv('ASSETS_CONTENT_SECURITY_POLICY')
			)
		)(req, res, next);
	}),

	// Return file
	asyncHandler(async (req, res) => {
		const id = req.params['pk']!.substring(0, 36);

		const service = new AssetsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const vary = ['Origin', 'Cache-Control'];

		const transformationParams: TransformationParams = res.locals['transformation'].key
			? (res.locals['shortcuts'] as TransformationParams[]).find(
					(transformation) => transformation['key'] === res.locals['transformation'].key
			  )
			: res.locals['transformation'];

		let acceptFormat: TransformationFormat | undefined;

		if (transformationParams.format === 'auto') {
			if (req.headers.accept?.includes('image/avif')) {
				acceptFormat = 'avif';
			} else if (req.headers.accept?.includes('image/webp')) {
				acceptFormat = 'webp';
			}

			vary.push('Accept');
		}

		let range: Range | undefined = undefined;

		if (req.headers.range) {
			const rangeParts = /bytes=([0-9]*)-([0-9]*)/.exec(req.headers.range);

			if (rangeParts && rangeParts.length > 1) {
				range = {};

				if (rangeParts[1]) {
					range.start = Number(rangeParts[1]);
					if (Number.isNaN(range.start)) throw new RangeNotSatisfiableException(range);
				}

				if (rangeParts[2]) {
					range.end = Number(rangeParts[2]);
					if (Number.isNaN(range.end)) throw new RangeNotSatisfiableException(range);
				}
			}
		}

		const { stream, file, stat } = await service.getAsset(id, { transformationParams, acceptFormat }, range);

		const filename = req.params['filename'] ?? file.filename_download;
		res.attachment(filename);
		res.setHeader('Content-Type', file.type);
		res.setHeader('Accept-Ranges', 'bytes');
		res.setHeader('Cache-Control', getCacheControlHeader(req, getMilliseconds(env['ASSETS_CACHE_TTL']), false, true));
		res.setHeader('Vary', vary.join(', '));

		const unixTime = Date.parse(file.modified_on);

		if (!Number.isNaN(unixTime)) {
			const lastModifiedDate = new Date(unixTime);
			res.setHeader('Last-Modified', lastModifiedDate.toUTCString());
		}

		if (range) {
			res.setHeader('Content-Range', `bytes ${range.start}-${range.end || stat.size - 1}/${stat.size}`);
			res.status(206);
			res.setHeader('Content-Length', (range.end ? range.end + 1 : stat.size) - (range.start || 0));
		} else {
			res.setHeader('Content-Length', stat.size);
		}

		if ('download' in req.query === false) {
			res.setHeader('Content-Disposition', contentDisposition(filename, { type: 'inline' }));
		}

		if (req.method.toLowerCase() === 'head') {
			res.status(200);
			res.setHeader('Accept-Ranges', 'bytes');
			res.setHeader('Content-Length', stat.size);

			return res.end();
		}

		let isDataSent = false;

		stream.on('data', (chunk) => {
			isDataSent = true;
			res.write(chunk);
		});

		stream.on('end', () => {
			res.end();
		});

		stream.on('error', (e) => {
			logger.error(e, `Couldn't stream file ${file.id} to the client`);

			if (!isDataSent) {
				res.removeHeader('Content-Type');
				res.removeHeader('Content-Disposition');
				res.removeHeader('Cache-Control');

				res.status(500).json({
					errors: [
						{
							message: 'An unexpected error occurred.',
							extensions: {
								code: 'INTERNAL_SERVER_ERROR',
							},
						},
					],
				});
			}
		});

		return undefined;
	})
);

export default router;
