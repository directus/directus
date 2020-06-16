import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import asyncHandler from 'express-async-handler';
import APIError, { errorHandler, ErrorCode } from './error';
import database from './database';

const app = express()
	.get(
		'/',
		asyncHandler(async (req, res, next) => {
			const records = await database.select('*').from('articles');
			res.json(records);
		})
	)
	.use(errorHandler);

export default app;
