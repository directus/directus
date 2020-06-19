import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import * as ExtensionsService from '../services/extensions';
import APIError, { ErrorCode } from '../error';

const router = Router();

router.get(
	'/:type',
	asyncHandler(async (req, res) => {
		const typeAllowList = ['interfaces', 'layouts', 'displays', 'modules'];

		if (typeAllowList.includes(req.params.type) === false) {
			throw new APIError(
				ErrorCode.EXTENSION_ILLEGAL_TYPE,
				`${req.params.type} is not an extension type.`
			);
		}

		const interfaces = await ExtensionsService.listExtensions(req.params.type);

		return res.json({
			data: interfaces,
		});
	})
);

export default router;
