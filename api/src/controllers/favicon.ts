import express from 'express';
import { respond } from '../middleware/respond.js';
import asyncHandler from '../utils/async-handler.js';
import { generateFavicon } from '../utils/generate-favicon.js';
import { ItemsService } from '../services/items.js';
import { AssetsService } from '../services/assets.js';
import { buffer } from 'stream/consumers';
import { fileTypeFromBuffer } from 'file-type';

const router = express.Router();

router.get(
	'/',
	asyncHandler(async (req, res, next) => {
		const settingsService = new ItemsService('directus_settings', {
			schema: req.schema,
		});

		const {
			project_color: projectColor,
			public_favicon: publicFavicon,
			project_logo: projectLogo,
		} = await settingsService.readSingleton({
			fields: ['project_color', 'public_favicon', 'project_logo'],
		});

		let imageBuffer;

		if (publicFavicon) {
			const assetsService = new AssetsService({ schema: req.schema });

			const favicon = await assetsService.getAsset(publicFavicon, {
				transformationParams: { width: 180, height: 180 },
			});

			imageBuffer = await buffer(favicon.stream);
		} else {
			imageBuffer = await generateFavicon(projectColor, !!projectLogo === false);
		}

		const fileType = await fileTypeFromBuffer(imageBuffer);
		if (fileType?.mime) res.setHeader('Content-Type', fileType.mime);

		res.locals['payload'] = imageBuffer;
		return next();
	}),
	respond,
);

export default router;
