import { Router } from 'express';
import Joi from 'joi';
import { InvalidPayloadException } from '../exceptions';
import { AuthenticationService } from '../services';
import { getSchema } from '../utils/get-schema';

const router = Router();

const loginSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().required(),
	mode: Joi.string().valid('cookie', 'json'),
	otp: Joi.string(),
}).unknown();

function setNoCache(req: any, res: any, next: any): void {
	res.set('Pragma', 'no-cache');
	res.set('Cache-Control', 'no-cache, no-store');
	next();
}

export default (oidc) => {
	router.get('/interaction/:uid', setNoCache, async (req, res, next) => {
		try {
			const details = await oidc.interactionDetails(req, res);
			const { uid, prompt, params } = details;

			const client = await oidc.Client.find(params.client_id);

			if (prompt.name === 'login') {
				return res.render('login', {
					client,
					uid,
					details: prompt.details,
					params,
					title: 'Sign-in',
					flash: undefined,
				});
			}

			return res.render('interaction', {
				client,
				uid,
				details: prompt.details,
				params,
				title: 'Authorize',
			});
		} catch (err) {
			return next(err);
		}
	});

	router.post('/interaction/:uid/login', setNoCache, async (req, res, next) => {
		try {
			const {
				prompt: { name },
			} = await oidc.interactionDetails(req, res);

			const accountability = {
				ip: req.ip,
				userAgent: req.get('user-agent'),
				role: null,
			};

			const authenticationService = new AuthenticationService({
				accountability: accountability,
				schema: await getSchema({ accountability }),
			});

			const { error } = loginSchema.validate(req.body);
			if (error) throw new InvalidPayloadException(error.message);

			const ip = req.ip;
			const userAgent = req.get('user-agent');

			const account = await authenticationService.authenticate({
				...req.body,
				ip,
				userAgent,
			});

			const result = {
				login: {
					accountId: account.id,
				},
			};

			await oidc.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
		} catch (err) {
			next(err);
		}
	});

	router.post('/interaction/:uid/confirm', setNoCache, async (req, res, next) => {
		try {
			const interactionDetails = await oidc.interactionDetails(req, res);
			const {
				prompt: { name, details },
				params,
				session: { accountId },
			} = interactionDetails;

			let { grantId } = interactionDetails;
			let grant;

			if (grantId) {
				// we'll be modifying existing grant in existing session
				grant = await oidc.Grant.find(grantId);
			} else {
				// we're establishing a new grant
				grant = new oidc.Grant({
					accountId,
					clientId: params.client_id,
				});
			}

			if (details.missingOIDCScope) {
				grant.addOIDCScope(details.missingOIDCScope.join(' '));
				// use grant.rejectOIDCScope to reject a subset or the whole thing
			}
			if (details.missingOIDCClaims) {
				grant.addOIDCClaims(details.missingOIDCClaims);
				// use grant.rejectOIDCClaims to reject a subset or the whole thing
			}
			if (details.missingResourceScopes) {
				// eslint-disable-next-line no-restricted-syntax
				for (const entry of Object.entries(details.missingResourceScopes)) {
					const indicator = entry[0];
					const scopes: any = entry[1];
					grant.addResourceScope(indicator, scopes.join(' '));
					// use grant.rejectResourceScope to reject a subset or the whole thing
				}
			}

			grantId = await grant.save();

			const consent: any = {};
			if (!interactionDetails.grantId) {
				// we don't have to pass grantId to consent, we're just modifying existing one
				consent.grantId = grantId;
			}

			const result = { consent };
			await oidc.interactionFinished(req, res, result, { mergeWithLastSubmission: true });
		} catch (err) {
			next(err);
		}
	});

	router.get('/interaction/:uid/abort', setNoCache, async (req, res, next) => {
		try {
			const result = {
				error: 'access_denied',
				error_description: 'End-User aborted interaction',
			};
			await oidc.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
		} catch (err) {
			next(err);
		}
	});

	return router;
};
