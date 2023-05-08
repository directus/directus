// @ts-nocheck

import { RequestHandler } from 'express';
import socketclusterService from '../services/socketcluster.js';

const socketcluster: RequestHandler = async (req, res, next) => {
	req.socketcluster = socketclusterService;

	return next();
};

export default socketcluster;
