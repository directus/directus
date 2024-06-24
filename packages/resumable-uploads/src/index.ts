import type { Router } from "express";
import { tusHandler } from "./handlers/index.js";
import { addCancelContext } from "./middleware/cancel.js";
import { validateTusHeaders } from "./middleware/headers.js";

export function registerResumableUploads(router: Router/*, options */) {
	router.post('/files/tus', addCancelContext, validateTusHeaders, tusHandler(async (/*req, res, next*/) => {
		// const service = new TusService({
		// 	accountability: req.accountability,
		// 	schema: req.schema,
		// 	cancel: req.cancel,
		// });

		// const context = service.createContext(req);
		// const response = await service.create(req, res);

		// return response;
	}));

	router.patch('/files/tus/:pk', addCancelContext, validateTusHeaders, tusHandler(async (/*req, res, next*/) => {

	}));

	router.delete('/files/tus/:pk', addCancelContext, validateTusHeaders, tusHandler(async (/*req, res, next*/) => {

	}));

	router.head('/files/tus/:pk', addCancelContext, validateTusHeaders, tusHandler(async (/*req, res, next*/) => {

	}));

	router.options('/files/tus/:pk', addCancelContext, validateTusHeaders, tusHandler(async (/*req, res, next*/) => {

	}));
}
