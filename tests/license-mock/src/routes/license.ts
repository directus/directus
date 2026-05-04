import type { FastifyInstance } from 'fastify';
import { licenses } from '../licenses.js';

export async function licenseRoute(app: FastifyInstance) {
	app.post('/', async (req, _res) => {
		licenses.push(req.body as any);
	});

	app.get('/', async (_req, res) => {
		return res.send(licenses);
	});

	app.get('/licenses/{license_key}', async (req, res) => {
		// Extract the license key from the request URL path
		const licenseKey = (req.params as any).license_key;
		const license = licenses.find((license) => license.key === licenseKey);

		if (!license) {
			return res.status(404).send({ error: 'License not found' });
		}

		res.send(license);
	});

	app.patch('/licenses/{license_key}', async (req, res) => {
		const licenseKey = (req.params as any).license_key;
		const license = licenses.find((license) => license.key === licenseKey);

		if (!license) {
			return res.status(404).send({ error: 'License not found' });
		}

		Object.assign(license, req.body);

		res.send(license);
	});

	app.delete('/licenses/{license_key}', async (req, res) => {
		const licenseKey = (req.params as any).license_key;
		const license = licenses.find((license) => license.key === licenseKey);

		if (!license) {
			return res.status(404).send({ error: 'License not found' });
		}

		licenses.splice(licenses.indexOf(license), 1);

		res.status(204).send();
	});
}
