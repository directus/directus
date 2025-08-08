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
		// @TODO probably should make this a separate util so we can reuse it consistently
		throw error.issues.map((issue) => new InvalidQueryError({ reason: `${issue.message} in "${issue.path}"` }));
	}

	const output = await translate(data.data, data.inputLang, data.outputLang);

	res.locals['payload'] = { data: output };

	return next();
});
