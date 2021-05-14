import chalk from 'chalk';
import { command } from '../../core/command';

export default command(
	{
		group: 'utils',
		description: 'Shows connected user information',
		usage: `
			\`\`\`
			$ $0 whoami
			\`\`\`
		`,
		documentation: `
			Shows information about the connected account.
		`,
		features: {
			sdk: true,
			query: 'one',
		},
		hints: ['who', 'me'],
	},
	async function ({ output, query, sdk }) {
		const user = await sdk.users.me.read({
			fields: ['*', '*.*'],
			...query.one,
		});
		await output.compose(async (ui) => {
			await ui.wrap(async (ui) => {
				const head = chalk.green.bold;
				const missing = chalk.italic.gray('No information');
				await ui.header('User');
				await ui.skip();
				await ui.table([
					[head('Name'), user.first_name ?? missing],
					[head('Email'), user.email ?? missing],
					[head('Role'), user.role?.name ?? missing],
				]);
			}, 1);
		});
		return user;
	}
);
