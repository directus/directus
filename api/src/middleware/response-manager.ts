/**
 * middleware to manage actions on responses such as
 * export / import and caching
 * @todo move set caching into here.
 * @todo error catching for
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
			const { Parser } = require('json2csv');

			const exportData = res.locals.data.data;

			const json2csvParser = new Parser();
			try {
				const csv = await json2csvParser.parse(exportData);
				// will this be ok for larger files?
				res.setHeader('Content-disposition', 'attachment; filename=export.csv');
				res.set('Content-Type', 'text/csv');
				res.status(200).send(csv);
			} catch (err) {
				throw new ExportFailedException('CSV parse failed.');
			}
		}
	}

	return next();
});

export default responseManager;
