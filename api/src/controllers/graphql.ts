import { Router } from 'express';
import { graphqlHTTP } from 'express-graphql';
import { GraphQLService } from '../services';
import asyncHandler from 'express-async-handler';

const router = Router();

router.use(asyncHandler(async (req, res) => {
	const service = new GraphQLService({ accountability: req.accountability });
	const schema = await service.getSchema();

	graphqlHTTP({ schema, graphiql: true })(req, res);
}));

export default router;

