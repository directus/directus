import { RequestHandler } from 'express';
import asyncHandler from 'express-async-handler';
import { ExportFailedException } from '../exceptions';

/**
 *  middleware to manage actions on responses such as
 * export / import and caching
 * @todo move caching into here.
 *
 */

const responseManager: RequestHandler = asyncHandler(async (req, res, next) => {
	if (!req.query.export) return next();
	// only want to export out on get
	if (req.method == 'GET') {
		const exportType = req.query.export;

		if (exportType == 'json') {
			// have chosen to export json
		}

		if (exportType == 'csv') {
			// have chosen to export csv
			console.log('get here');
			const { Parser } = require('json2csv');
			const exportData = res.json;

			const fields = Object.keys(exportData);

			Parser({ data: exportData }, function (err: any, csvStr: string) {
				if (err) {
					throw new ExportFailedException('CSV generation failed');
				}
				res.type('text/csv');
				res.attachment('export-file.csv');
				res.send(csvStr);
			});
		}
	}

	return next();
});

export default responseManager;
