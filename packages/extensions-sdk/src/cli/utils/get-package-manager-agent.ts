/**
 * Extract the npm user agent from the npm_config_user_agent environment variable string
 */
export default function getPackageManagerAgent(): Record<string, string> | null {
	const userAgent = process.env.npm_config_user_agent;

	if (!userAgent) return null;

	const values = userAgent.split(' ');
	const fields = values.filter((field) => field.includes('/'));
	const [platform, arch] = values.filter((field) => !field.includes('/'));

	return Object.fromEntries(fields.map((field) => field.split('/')).concat([['os', `${platform} (${arch})`]]));
}
