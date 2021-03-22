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
