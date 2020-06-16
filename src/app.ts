import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import bodyParser from 'body-parser';
import { errorHandler } from './error';
import itemsRouter from './routes/items';

const app = express()
	.disable('x-powered-by')
	.use(bodyParser.json())
	.use('/items', itemsRouter)
	.use(errorHandler);

export default app;
