/**
 * Sanitize query parameters.
 * This ensures that query params are formatted and ready to go for the services.
 */

import { RequestHandler } from 'express';
import { Query, Sort, Filter, FilterOperator } from '../types/query';
import { Meta } from '../types/meta';

const sanitizeQuery: RequestHandler = (req, res, next) => {
	if (!req.query) return;

	const query: Query = {};

	if (req.query.fields) {
		query.fields = sanitizeFields(req.query.fields);
	}

	if (req.query.sort) {
		query.sort = sanitizeSort(req.query.sort);
	}

	if (req.query.filter) {
		query.filter = sanitizeFilter(req.query.filter);
	}

	if (req.query.limit) {
		query.limit = sanitizeLimit(req.query.limit);
	}

	if (req.query.offset) {
		query.offset = sanitizeOffset(req.query.offset);
	}

	if (req.query.page) {
		query.page = sanitizePage(req.query.page);
	}

	if (req.query.single) {
		query.single = sanitizeSingle(req.query.single);
	}

	if (req.query.meta) {
		query.meta = sanitizeMeta(req.query.meta);
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

function sanitizeFilter(rawFilter: any) {
	const filters: Filter[] = [];

	Object.keys(rawFilter).forEach((column) => {
		Object.keys(rawFilter[column]).forEach((operator: FilterOperator) => {
			const value = rawFilter[column][operator];
			filters.push({ column, operator, value });
		});
	});

	return filters;
}

function sanitizeLimit(rawLimit: any) {
	return Number(rawLimit);
}

function sanitizeOffset(rawOffset: any) {
	return Number(rawOffset);
}

function sanitizePage(rawPage: any) {
	return Number(rawPage);
}

function sanitizeSingle(rawSingle: any) {
	return true;
}

function sanitizeMeta(rawMeta: any) {
	if (rawMeta === '*') {
		return Object.values(Meta);
	}

	if (rawMeta.includes(',')) {
		return rawMeta.split(',');
	}

	if (Array.isArray(rawMeta)) {
		return rawMeta;
	}
}
