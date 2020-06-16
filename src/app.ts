import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { errorHandler } from './error';
import itemsRouter from './routes/items';

const app = express().use('/items', itemsRouter).use(errorHandler);

export default app;
