import Listr from 'listr';

export default async () => {
	console.log('\n');

	await new Listr([
		{
			title: 'Close database connections',
			task: () =>
				new Listr(
					[
						{
							title: 'Postgres',
							task: async () => await global.__databases__[0].destroy(),
						},
					],
					{ concurrent: true }
				),
		},
		{
			title: 'Stop Docker containers',
			task: () =>
				new Listr(
					[
						{
							title: 'Postgres',
							task: async () => await Promise.all(global.__containers__.map((container) => container.stop())),
						},
					],
					{ concurrent: true }
				),
		},
		{
			title: 'Remove Docker containers',
			task: () =>
				new Listr(
					[
						{
							title: 'Postgres',
							task: async () => await Promise.all(global.__containers__.map((container) => container.remove())),
						},
					],
					{ concurrent: true }
				),
		},
	]).run();

	console.log('\n');

	console.log(`👮‍♀️ Done testing!\n`);
};
