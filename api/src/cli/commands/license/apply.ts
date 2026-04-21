import { InvalidPayloadError } from '@directus/errors';
import { getCurrentLicenseBinding } from '../../../license/binding.js';
import { normalizeOptionalLicenseKey } from '../../../license/license-context.js';
import { applyLicense } from '../../../license/lifecycle.js';

export default async function applyLicenseCommand({ key }: { key?: string }): Promise<void> {
	try {
		const explicitKey = normalizeOptionalLicenseKey(key);
		const binding = await getCurrentLicenseBinding();
		const source = binding.source;

		if (explicitKey && source === 'env') {
			throw new InvalidPayloadError({ reason: 'License key is managed in ENV' });
		}

		const activeLicenseKey = explicitKey ?? binding.licenseKey;

		if (!activeLicenseKey) {
			throw new InvalidPayloadError({ reason: 'No license key is configured' });
		}

		const result = await applyLicense(activeLicenseKey, {
			...(binding.storedProjectId ? { projectId: binding.storedProjectId } : {}),
			source: explicitKey ? 'settings' : (binding.source ?? 'settings'),
			replaceTerminalLicense: explicitKey !== null,
		});

		process.stdout.write('License applied.\n');
		process.stdout.write(`${JSON.stringify(result.payload, null, 2)}\n`);
		process.exit(0);
	} catch (error) {
		process.stderr.write(error instanceof Error ? error.message : String(error));
		process.stderr.write('\n');
		process.exit(1);
	}
}
