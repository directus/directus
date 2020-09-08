import { RequestHandler } from "express";
import asyncHandler from "express-async-handler";
import env from "../env";
import { getCacheKey } from "../utils/get-cache-key";
import cache from '../cache';

export const respond: RequestHandler = asyncHandler(async (req, res) => {
	if (env.CACHE_ENABLED === true && cache) {
		const key = getCacheKey(req);
		await cache.set(key, res.locals.payload);
		console.log(key);
	}

	return res.json(res.locals.payload);
});
