import type { FastifyInstance } from 'fastify';
import { merge } from 'lodash-es';
import { type License, licenses } from '../licenses.js';

export async function licenseRoute(app: FastifyInstance) {
	app.post<{ Body: License }>('/', async (req, _res) => {
		licenses[req.body.key] = req.body;
	});

	app.get('/', async (_req, res) => {
		return res.send(Object.values(licenses));
	});

	app.get<{ Params: { license_key: string } }>('/:license_key', async (req, res) => {
		// Extract the license key from the request URL path
		const license = licenses[req.params.license_key];

		if (!license) {
			return res.status(404).send({ error: 'License not found' });
		}

		res.send(license);
	});

	app.patch<{ Body: License; Params: { license_key: string } }>('/:license_key', async (req, res) => {
		const license = licenses[req.params.license_key];

		if (!license) {
			return res.status(404).send({ error: 'License not found' });
		}

		licenses[req.params.license_key] = merge(license, req.body);

		res.send(license);
	});

	app.delete<{ Params: { license_key: string } }>('/:license_key', async (req, res) => {
		if (!(req.params.license_key in licenses)) {
			return res.status(404).send({ error: 'License not found' });
		}

		delete licenses[req.params.license_key];

		res.status(204).send();
	});
}
