import { Router } from 'express';
import { GraphQLService } from '../services';
import { respond } from '../middleware/respond';
import asyncHandler from '../utils/async-handler';
import { parseGraphQL } from '../middleware/graphql';
import cookieParser from 'cookie-parser';

const router = Router();

router.use(
	'/system',
	parseGraphQL,
	cookieParser(),
	asyncHandler(async (req, res, next) => {
		const service = new GraphQLService({
			accountability: req.accountability,
			schema: req.schema,
			scope: 'system',
		});

		res.locals.payload = await service.execute(res.locals.graphqlParams);

		return next();
	}),
	respond
);

router.use(
	'/',
	parseGraphQL,
	cookieParser(),
	asyncHandler(async (req, res, next) => {
		const service = new GraphQLService({
			accountability: req.accountability,
			schema: req.schema,
			scope: 'items',
		});

		res.locals.payload = await service.execute(res.locals.graphqlParams);

		return next();
	}),
	respond
);

export default router;
