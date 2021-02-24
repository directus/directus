import { Router } from 'express';
import { graphqlHTTP } from 'express-graphql';
import { GraphQLService } from '../services';
import { respond } from '../middleware/respond';
import asyncHandler from '../utils/async-handler';
import { cloneDeep } from 'lodash';

const router = Router();

router.use(
	asyncHandler(async (req, res, next) => {
		const service = new GraphQLService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const schema = await service.getSchema();

		/**
		 * @NOTE express-graphql will attempt to respond directly on the `res` object
		 * We don't want that, as that will skip our regular `respond` middleware
		 * and therefore skip the cache. This custom response object overwrites
		 * express' regular `json` function in order to trick express-graphql to
		 * use the next middleware instead of respond with data directly
		 */
		const customResponse = cloneDeep(res);

		customResponse.json = customResponse.end = function (payload: Record<string, any>) {
			res.locals.payload = payload;

			if (customResponse.getHeader('content-type')) {
				res.setHeader('Content-Type', customResponse.getHeader('content-type')!);
			}

			if (customResponse.getHeader('content-length')) {
				res.setHeader('content-length', customResponse.getHeader('content-length')!);
			}

			return next();
		} as any;

		graphqlHTTP({ schema, graphiql: true })(req, customResponse);
	}),
	respond
);

export default router;
