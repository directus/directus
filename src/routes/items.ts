import express, { RequestHandler } from 'express';
import asyncHandler from 'express-async-handler';
import * as itemsService from '../services/items';

const readItems: RequestHandler = asyncHandler(async (req, res) => {
	const records = await itemsService.readAll(req.params.collection);
	res.json({
		data: records,
	});
});

const createItem: RequestHandler = asyncHandler(async (req, res) => {
	await itemsService.create(req.params.collection, req.body);
	res.status(200).end();
});

const router = express.Router().get('/:collection', readItems).post('/:collection', createItem);

export default router;
