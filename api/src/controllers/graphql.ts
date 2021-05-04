import { Router } from 'express';
import { parseGraphQL } from '../middleware/graphql';
import { respond } from '../middleware/respond';
import { GraphQLService } from '../services';
import asyncHandler from '../utils/async-handler';

const router = Router();

router.use(
	'/system',
	parseGraphQL,
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
