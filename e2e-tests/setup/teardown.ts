import Listr from 'listr';
import { Knex } from 'knex';
import Dockerode from 'dockerode';
import { getDBsToTest } from '../get-dbs-to-test';
import config from '../config';

declare module global {
	let databaseContainers: { vendor: string; container: Dockerode.Container }[];
	let directusContainers: { vendor: string; container: Dockerode.Container }[];
	let knexInstances: { vendor: string; knex: Knex }[];
}

export default async () => {
	const vendors = getDBsToTest();

	console.log('\n');

	await new Listr([
		{
			title: 'Stop Docker containers',
			task: () => {
				return new Listr(
					vendors.map((vendor) => {
						return {
							title: config.names[vendor]!,
							task: () => {
								return new Listr(
									[
										{
											title: 'Database',
											task: async () =>
												await global.databaseContainers
													.find((containerInfo) => containerInfo.vendor === vendor)
													?.container.stop(),
										},
										{
											title: 'Directus',
											task: async () =>
												await global.directusContainers
													.find((containerInfo) => containerInfo.vendor === vendor)
													?.container.stop(),
										},
									],
									{ concurrent: true }
								);
							},
						};
					}),
					{ concurrent: true }
				);
			},
		},
		{
			title: 'Remove Docker containers',
			task: () => {
				return new Listr(
					vendors.map((vendor) => {
						return {
							title: config.names[vendor]!,
							task: () => {
								return new Listr(
									[
										{
											title: 'Database',
											task: async () =>
												await global.databaseContainers
													.find((containerInfo) => containerInfo.vendor === vendor)
													?.container.remove(),
										},
										{
											title: 'Directus',
											task: async () =>
												await global.directusContainers
													.find((containerInfo) => containerInfo.vendor === vendor)
													?.container.remove(),
										},
									],
									{ concurrent: true }
								);
							},
						};
					}),
					{ concurrent: true }
				);
			},
		},
	]).run();

	console.log('\n');

	console.log(`👮‍♀️ Tests complete!\n`);
};
