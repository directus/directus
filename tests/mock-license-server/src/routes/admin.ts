import type { FastifyInstance } from 'fastify';
import { merge } from 'lodash-es';
import { licenseStore } from '../store.js';
import type { MockLicense } from '../types.js';

export async function adminRoute(app: FastifyInstance) {
	app.post<{ Body: MockLicense }>('/', async (req, res) => {
		licenseStore[req.body.key] = req.body;

		return res.send(req.body);
	});

	app.get('/', async (_req, res) => {
		return res.send(Object.values(licenseStore));
	});

	app.get<{ Params: { license_key: string } }>('/:license_key', async (req, res) => {
		// Extract the license key from the request URL path
		const license = licenseStore[req.params.license_key];

		if (!license) {
			return res.status(404).send({ error: 'License not found' });
		}

		res.send(license);
	});

	app.patch<{ Body: MockLicense; Params: { license_key: string } }>('/:license_key', async (req, res) => {
		const license = licenseStore[req.params.license_key];

		if (!license) {
			return res.status(404).send({ error: 'License not found' });
		}

		licenseStore[req.params.license_key] = merge(license, req.body);

		res.send(license);
	});

	app.delete<{ Params: { license_key: string } }>('/:license_key', async (req, res) => {
		if (!(req.params.license_key in licenseStore)) {
			return res.status(404).send({ error: 'License not found' });
		}

		delete licenseStore[req.params.license_key];

		res.status(204).send();
	});
}
