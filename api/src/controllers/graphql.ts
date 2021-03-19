import { Router } from 'express';
import { GraphQLService } from '../services';
import { respond } from '../middleware/respond';
import asyncHandler from '../utils/async-handler';
import { parseGraphQL } from '../middleware/graphql';

const router = Router();

router.use(
	'/system',
	parseGraphQL,
	asyncHandler(async (req, res, next) => {
		const service = new GraphQLService({
			accountability: req.accountability,
			schema: req.schema,
		});

		res.locals.payload = await service.execute(res.locals.graphqlParams, 'system');

		return next();
	}),
	respond
);

router.use(
	'/',
	parseGraphQL,
	asyncHandler(async (req, res, next) => {
		const service = new GraphQLService({
			accountability: req.accountability,
			schema: req.schema,
		});

		res.locals.payload = await service.execute(res.locals.graphqlParams, 'items');

		return next();
	}),
	respond
);

export default router;
