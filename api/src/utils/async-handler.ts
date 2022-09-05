import type { RequestHandler, Request, Response, NextFunction } from 'express';

const asyncHandler = (fn: RequestHandler) => (req: Request, res: Response, next: NextFunction) =>
	Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
