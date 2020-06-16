import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import bodyParser from 'body-parser';
import { errorHandler } from './error';
import itemsRouter from './routes/items';

const app = express().use(bodyParser.json()).use('/items', itemsRouter).use(errorHandler);

export default app;
