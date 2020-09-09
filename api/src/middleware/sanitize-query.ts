/**
 * Sanitize query parameters.
 * This ensures that query params are formatted and ready to go for the services.
 */

import { RequestHandler } from 'express';
import { Accountability, Query, Sort, Filter, Meta } from '../types';
import logger from '../logger';
import { parseFilter } from '../utils/parse-filter';

const sanitizeQuery: RequestHandler = (req, res, next) => {
	req.sanitizedQuery = {};
	if (!req.query) return;

	const query: Query = {
		fields: sanitizeFields(req.query.fields) || ['*'],
	};

	if (req.query.limit !== undefined) {
		const limit = sanitizeLimit(req.query.limit);

		if (typeof limit === 'number') {
			query.limit = limit;
		}
	}

	if (req.query.sort) {
		query.sort = sanitizeSort(req.query.sort);
	}

	if (req.query.filter) {
		query.filter = sanitizeFilter(req.query.filter, req.accountability || null);
	}

	if (req.query.limit == '-1') {
		delete query.limit;
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

	if (req.query.search && typeof req.query.search === 'string') {
		query.search = req.query.search;
	}

	if (req.query.export && typeof req.query.export === 'string' && ['json', 'csv'].includes(req.query.export)) {
		query.export = req.query.export as 'json' | 'csv';
	}

	req.sanitizedQuery = query;
	Object.freeze(req.sanitizedQuery);
	return next();
};

export default sanitizeQuery;

function sanitizeFields(rawFields: any) {
	if (!rawFields) return;

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

function sanitizeFilter(rawFilter: any, accountability: Accountability | null) {
	let filters: Filter = rawFilter;

	if (typeof rawFilter === 'string') {
		try {
			filters = JSON.parse(rawFilter);
		} catch {
			logger.warn('Invalid value passed for filter query parameter.');
		}
	}

	filters = parseFilter(filters, accountability);

	return filters;
}

function sanitizeLimit(rawLimit: any) {
	if (rawLimit === undefined || rawLimit === null) return null;
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

	return [rawMeta];
}
