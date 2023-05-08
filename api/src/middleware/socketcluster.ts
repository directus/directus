import socketclusterService from '../services/socketcluster.js';

const socketcluster = async (req: any, res, next) => {
	req.socketcluster = socketclusterService;

	return next();
};

export default socketcluster;
