import { RequestHandler } from "express";
import asyncHandler from "express-async-handler";
import env from "../env";
import { getCacheKey } from "../utils/get-cache-key";
import cache from '../cache';
import { Transform, transforms } from 'json2csv';
import { PassThrough } from "stream";

export const respond: RequestHandler = asyncHandler(async (req, res) => {
	if (req.method.toLowerCase() === 'get' && env.CACHE_ENABLED === true && cache && !req.sanitizedQuery.export) {
		const key = getCacheKey(req);
		await cache.set(key, res.locals.payload);
	}

	if (req.sanitizedQuery.export === 'json') {
		res.attachment('export.json');
		res.set('Content-Type', 'application/json');
		return res.status(200).send(JSON.stringify(res.locals.payload, null, '\t'));
	}

	if (req.sanitizedQuery.export === 'csv') {
		res.attachment('export.csv');
		res.set('Content-Type', 'text/csv');
		const stream = new PassThrough();
		stream.end(Buffer.from(JSON.stringify(res.locals.payload.data), 'utf-8'));
		const json2csv = new Transform({ transforms: [transforms.flatten({ separator: '.' })] });
		return stream.pipe(json2csv).pipe(res);
	}

	return res.json(res.locals.payload);
});
