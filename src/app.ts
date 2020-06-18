import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import bodyParser from 'body-parser';
import { errorHandler } from './error';
import itemsRouter from './routes/items';
import activityRouter from './routes/activity';
import notFoundHandler from './routes/not-found';

const app = express()
	.disable('x-powered-by')
	.use(bodyParser.json())
	.use('/items', itemsRouter)
	.use('/activity', activityRouter)
	.use(notFoundHandler)
	.use(errorHandler);

export default app;
