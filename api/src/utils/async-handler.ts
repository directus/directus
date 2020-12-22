import { NextFunction, Request, Response } from 'express';

export type AsyncHandler<T> = (req: Request, res: Response, ...others: any) => Promise<T>;
export type AsyncHandlerNext<T> = (req: Request, res: Response, next: NextFunction, ...others: any) => Promise<T>;
export type AsyncHandlerError<T> = (
	err: Error,
	req: Request,
	res: Response,
	next: NextFunction,
	...others: any
) => Promise<T>;
export type AsyncMiddleware<T> = AsyncHandler<T> | AsyncHandlerNext<T> | AsyncHandlerError<T>;

/**
 * Handles promises in routes.
 */
function asyncHandler<T>(handler: AsyncMiddleware<T>): any {
	if (handler.length == 2) {
		return function (req: Request, res: Response, next: NextFunction, ...others: any) {
			return Promise.resolve((handler as AsyncHandler<T>)(req, res, ...others)).catch(next);
		};
	} else if (handler.length == 3) {
		return function (req: Request, res: Response, next: NextFunction, ...others: any) {
			return Promise.resolve((handler as AsyncHandlerNext<T>)(req, res, next, ...others)).catch(next);
		};
	} else if (handler.length == 4) {
		return function (err: Error, req: Request, res: Response, next: NextFunction, ...others: any) {
			return Promise.resolve((handler as AsyncHandlerError<T>)(err, req, res, next, ...others)).catch(next);
		};
	} else {
		throw new Error(`Failed to asyncHandle() function "${handler.name}"`);
	}
}

export default asyncHandler;
