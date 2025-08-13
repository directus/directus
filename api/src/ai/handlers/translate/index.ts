import { InvalidQueryError } from '@directus/errors';
import { z } from 'zod';
import asyncHandler from '../../../utils/async-handler.js';
import { translate } from './lib/translate.js';

const reqSchema = z.object({
	data: z.record(z.string(), z.any()),
	inputLang: z.string(),
	outputLang: z.string(),
});

export const restHandler = asyncHandler(async (req, res, next) => {
	const { success, data, error } = reqSchema.safeParse(req.body);

	if (!success) {
		// TODO probably should make this a separate util so we can reuse it consistently
		throw error.issues.map((issue) => new InvalidQueryError({ reason: `${issue.message} in "${issue.path}"` }));
	}

	// TODO this now circumvents the respond middleware. Problem?
	res.contentType('application/json');

	const stream = await translate(data.data, data.inputLang, data.outputLang);

	res.status(204);

	// for await (const chunk of stream.partialObjectStream) {
	// 	res.write(JSON.stringify(chunk) + `\n`);
	// }

	res.end();
});
