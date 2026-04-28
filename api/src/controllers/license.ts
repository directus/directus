import express from 'express';
import {
	maybeThrowMockError,
	MOCK_LICENSE_ADDONS,
	MOCK_LICENSE_PREVIEW,
	MOCK_LICENSE_RESOLVE,
	pickLicenseScenario,
} from '../license/mocks.js';
import { respond } from '../middleware/respond.js';
import asyncHandler from '../utils/async-handler.js';

const router = express.Router();

// Get current license state. Use ?scenario=<name> to switch mocks (active, grace, expired, suspended, canceled, overage, no-license).
router.get(
	'/',
	asyncHandler(async (req, res, next) => {
		res.locals['payload'] = { data: pickLicenseScenario(req.query['scenario']) };
		return next();
	}),
	respond,
);

// Validate a license key without applying it. Use ?error=<code> to test error states.
router.get(
	'/preview',
	asyncHandler(async (req, res, next) => {
		maybeThrowMockError(req.query['error'], ['LICENSE_INVALID', 'LICENSE_SERVICE_UNAVAILABLE']);

		res.locals['payload'] = { data: MOCK_LICENSE_PREVIEW };
		return next();
	}),
	respond,
);

// Resource Resolution assessment (or deactivation preview when ?deactivate=true).
router.get(
	'/resolve',
	asyncHandler(async (_req, res, next) => {
		res.locals['payload'] = { data: MOCK_LICENSE_RESOLVE };
		return next();
	}),
	respond,
);

// Catalog of addons available for the current subscription.
router.get(
	'/addons',
	asyncHandler(async (_req, res, next) => {
		res.locals['payload'] = { data: MOCK_LICENSE_ADDONS };
		return next();
	}),
	respond,
);

export default router;
