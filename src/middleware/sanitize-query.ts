/**
 * Sanitize query parameters.
 * This ensures that query params are formatted and ready to go for the services.
 */

import { RequestHandler } from 'express';
import { Query, Sort } from '../types/query';

const sanitizeQuery: RequestHandler = (req, res, next) => {
	if (!req.query) return;

	const query: Query = {};

	if (req.query.fields) {
		query.fields = sanitizeFields(req.query.fields);
	}

	if (req.query.sort) {
		query.sort = sanitizeSort(req.query.sort);
	}

	res.locals.query = query;
	return next();
};

export default sanitizeQuery;

function sanitizeFields(rawFields: any) {
	let fields: string[] = [];

	if (typeof rawFields === 'string') fields = rawFields.split(',');
	else if (Array.isArray(rawFields)) fields = rawFields as string[];

	return fields;
}

function sanitizeSort(rawSort: any) {
	let fields: string[] = [];

	if (typeof rawSort === 'string') fields = rawSort.split(',');
	else if (Array.isArray(rawSort)) fields = rawSort as string[];

	return fields.map((field) => {
		const order = field.startsWith('-') ? 'desc' : 'asc';
		const column = field.startsWith('-') ? field.substring(1) : field;
		return { column, order } as Sort;
	});
}
