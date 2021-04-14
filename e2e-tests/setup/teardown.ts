import Listr from 'listr';
import { Knex } from 'knex';
import Dockerode from 'dockerode';
import { getDBsToTest } from '../get-dbs-to-test';
import config, { CONTAINER_PERSISTENCE_FILE } from '../config';
import { GlobalConfigTsJest } from 'ts-jest/dist/types';
import { readFileSync, rmSync } from 'fs';

declare module global {
	let databaseContainers: { vendor: string; container: Dockerode.Container }[];
	let directusContainers: { vendor: string; container: Dockerode.Container }[];
	let knexInstances: { vendor: string; knex: Knex }[];
}
const docker = new Dockerode();

if (require.main === module) {
	teardown(undefined, true);
}

export default async function teardown(jestConfig?: GlobalConfigTsJest, isAfterWatch = false) {
	if (jestConfig?.watch || jestConfig?.watchAll) return;

	const vendors = getDBsToTest();

	console.log('\n');

	await new Listr([
		{
			skip: () => !isAfterWatch,
			title: 'Restore container info',
			task: async () => {
				const containers = JSON.parse(readFileSync(CONTAINER_PERSISTENCE_FILE).toString());
				if (!(containers.db && containers.directus)) {
					throw new Error('Could not load saved containers');
				}
				const restorePersistedContainer = ({ vendor, id }: { vendor: string; id: string }) => ({
					vendor,
					container: docker.getContainer(id),
				});
				global.databaseContainers = containers.db.map(restorePersistedContainer);
				global.directusContainers = containers.directus.map(restorePersistedContainer);
				rmSync(CONTAINER_PERSISTENCE_FILE);
			},
		},
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
									{ concurrent: true, exitOnError: false }
								);
							},
						};
					}),
					{ concurrent: true, exitOnError: false }
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
									{ concurrent: true, exitOnError: false }
								);
							},
						};
					}),
					{ concurrent: true, exitOnError: false }
				);
			},
		},
	]).run();

	console.log('\n');

	console.log(`👮‍♀️ Tests complete!\n`);
}
