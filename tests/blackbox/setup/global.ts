import { ChildProcess } from 'child_process';

const global = {
	directus: {} as { [vendor: string]: ChildProcess },
	directusNoCache: {} as { [vendor: string]: ChildProcess },
};

export default global;
