import { Request, Response, Router } from 'express';
import { graphqlHTTP } from 'express-graphql';
import { GraphQLService } from '../services';
import asyncHandler from '../utils/async-handler';

const router = Router();

router.use(
	asyncHandler(async (req: Request, res: Response) => {
		const service = new GraphQLService({
			accountability: req.accountability,
			schema: req.schema,
		});
		const schema = await service.getSchema();

		graphqlHTTP({ schema, graphiql: true })(req, res);
	})
);

export default router;
