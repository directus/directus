import { Router } from 'express';
import { GraphQLService } from '../../services/graphql/index.js';
import asyncHandler from '../../utils/async-handler.js';
import { respond } from '../handlers/respond.js';
import { parseGraphQl } from './handlers/parse-graphql.js';

const router = Router();

router.use(
	'/system',
	parseGraphQl,
	asyncHandler(async (req, res, next) => {
		const service = new GraphQLService({
			accountability: req.accountability,
			schema: req.schema,
			scope: 'system',
		});

		res.locals['payload'] = await service.execute(res.locals['graphqlParams']);

		if (res.locals['payload']?.errors?.length > 0) {
			res.locals['cache'] = false;
		}

		return next();
	}),
	respond,
);

router.use(
	'/',
	parseGraphQl,
	asyncHandler(async (req, res, next) => {
		const service = new GraphQLService({
			accountability: req.accountability,
			schema: req.schema,
			scope: 'items',
		});

		res.locals['payload'] = await service.execute(res.locals['graphqlParams']);

		if (res.locals['payload']?.errors?.length > 0) {
			res.locals['cache'] = false;
		}

		return next();
	}),
	respond,
);

export default router;
