function getPackageManagerAgent(): Record<string, string> | null {
	const userAgent = process.env.npm_config_user_agent;

	if (!userAgent) return null;

	const values = userAgent.split(' ');
	const fields = values.filter((field) => field.includes('/'));
	const [platform, arch] = values.filter((field) => !field.includes('/'));

	return Object.fromEntries(fields.map((field) => field.split('/')).concat([['os', `${platform} (${arch})`]]));
}

export default function getPackageManager(): string {
	const agent = getPackageManagerAgent();

	if (agent !== null) {
		if (agent.pnpm !== undefined && agent.pnpm !== '?') return 'pnpm';
		if (agent.yarn !== undefined && agent.yarn !== '?') return 'yarn';
	}

	return 'npm';
}
