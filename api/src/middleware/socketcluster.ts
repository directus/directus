import socketclusterService from '../services/socketcluster.js';

const socketcluster = async (req: any, _res: any, next: any) => {
	req.socketcluster = socketclusterService;

	return next();
};

export default socketcluster;
