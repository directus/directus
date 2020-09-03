/**
 * middleware to manage actions on responses such as
 * export / import and caching
 * @todo move set caching into here.
 *
 */
import { RequestHandler } from 'express';
import asyncHandler from 'express-async-handler';
import { ExportFailedException } from '../exceptions';

const responseManager: RequestHandler = asyncHandler(async (req, res, next) => {
	if (!req.query.export) {
		res.json(res.locals.data);
	}
	// only want to export out on get
	if (req.method == 'GET') {
		const exportType = req.query.export;

		if (exportType == 'json') {
			// have chosen to export json
			res.setHeader('Content-disposition', 'attachment; filename=export.json');
			res.set('Content-Type', 'text/json');
			res.status(200).send(res.locals.data);
		}

		if (exportType == 'csv') {
			// have chosen to export csv
			const json2csv = require('json2csv');

			// need to get the actual fields in data
			const exportData = res.locals.data;
			/** @todo deep object parsing to get all fields
			 */

			const fieldsOut = Object.keys(exportData);
			const csv = await json2csv.parse(exportData, fieldsOut);
			// will this be ok for larger files?
			res.setHeader('Content-disposition', 'attachment; filename=export.csv');
			res.set('Content-Type', 'text/csv');
			res.status(200).send(csv);
		}
	}

	return next();
});

export default responseManager;
