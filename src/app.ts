import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import bodyParser from 'body-parser';
import { errorHandler } from './error';
import itemsRouter from './routes/items';
import activityRouter from './routes/activity';
import collectionPresetsRouter from './routes/collection-presets';
import filesRouter from './routes/files';
import notFoundHandler from './routes/not-found';

const app = express()
	.disable('x-powered-by')
	.use(bodyParser.json())
	.use('/items', itemsRouter)
	.use('/files', filesRouter)
	.use('/activity', activityRouter)
	.use('/collection_presets', collectionPresetsRouter)
	.use(notFoundHandler)
	.use(errorHandler);

export default app;
