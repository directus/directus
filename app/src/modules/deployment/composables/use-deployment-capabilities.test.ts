import { describe, expect, it } from 'vitest';
import { useDeploymentCapabilities } from './use-deployment-capabilities';

describe('useDeploymentCapabilities', () => {
	const loadingDefault = {
		eventsTransport: 'webhook',
		supportsPreviewDeploy: false,
		supportsDeployHookUrl: false,
		needsRunStatusPolling: false,
	};

	it('should return the loading default before anything is set', () => {
		const { capabilities } = useDeploymentCapabilities('vercel');
		expect(capabilities.value).toEqual(loadingDefault);
	});

	it('should return the capabilities from a successfully loaded deployment', () => {
		const { capabilities, setFromDeployment } = useDeploymentCapabilities('vercel');

		setFromDeployment({
			capabilities: {
				eventsTransport: 'poll',
				supportsPreviewDeploy: true,
				supportsDeployHookUrl: true,
				needsRunStatusPolling: true,
			},
		});

		expect(capabilities.value).toEqual({
			eventsTransport: 'poll',
			supportsPreviewDeploy: true,
			supportsDeployHookUrl: true,
			needsRunStatusPolling: true,
		});
	});

	it('should fall back to the loading default when the deployment has no capabilities', () => {
		const { capabilities, setFromDeployment } = useDeploymentCapabilities('vercel');

		setFromDeployment({});

		expect(capabilities.value).toEqual(loadingDefault);
	});

	it('should reset to the loading default on error, discarding any previously loaded capabilities', () => {
		const { capabilities, setFromDeployment, reset } = useDeploymentCapabilities('vercel');

		setFromDeployment({
			capabilities: {
				eventsTransport: 'poll',
				supportsPreviewDeploy: true,
				supportsDeployHookUrl: true,
				needsRunStatusPolling: true,
			},
		});

		reset();

		expect(capabilities.value).toEqual(loadingDefault);
	});
});
