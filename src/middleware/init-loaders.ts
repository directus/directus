/**
 * Sets up the data loaders for this individual request. This allows us to reuse the same system
 * loaders in the other middleware and route handlers
 */

import { RequestHandler } from 'express';
import createSystemLoaders from '../loaders';

const initLoaders: RequestHandler = (req, res, next) => {
	req.loaders = createSystemLoaders();
	next();
};

export default initLoaders;
