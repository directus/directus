import { ChildProcess } from 'child_process';

const global = {
	directus: {} as { [vendor: string]: ChildProcess },
	directusNoCache: {} as { [vendor: string]: ChildProcess },
	mockLicenseServer: undefined as ChildProcess | undefined,
};

export default global;
