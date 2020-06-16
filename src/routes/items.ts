import express, { RequestHandler } from 'express';
import asyncHandler from 'express-async-handler';

const readItems: RequestHandler = asyncHandler((req, res) => {
	res.send('Hi there');
});

const router = express.Router().get('/:collection', readItems);

export default router;
