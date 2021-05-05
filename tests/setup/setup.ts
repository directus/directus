import Dockerode, { ContainerSpec } from 'dockerode';
import knex from 'knex';
import { awaitDatabaseConnection, awaitDirectusConnection } from './utils/await-connection';
import Listr, { ListrTask } from 'listr';
import { getDBsToTest } from '../get-dbs-to-test';
import config, { CONTAINER_PERSISTENCE_FILE } from '../config';
import globby from 'globby';
import path from 'path';
import { GlobalConfigTsJest } from 'ts-jest/dist/types';
import { writeFileSync } from 'fs';
import global from './global';

const docker = new Dockerode();
let started = false;

export default async (jestConfig: GlobalConfigTsJest): Promise<void> => {
	if (started) return;
	started = true;

	console.log('\n\n');

	console.log(`👮‍♀️ Starting tests!\n`);

	const vendors = getDBsToTest();

	const NODE_VERSION = process.env.TEST_NODE_VERSION || '15-alpine';

	await new Listr([
		{
			title: 'Create Directus Docker Image',
			task: async (_, task) => {
				const result = await globby(['**/*', '!node_modules', '!**/node_modules', '!**/src', '!tests', '!**/tests'], {
					cwd: path.resolve(__dirname, '..', '..'),
				});

				const stream = await docker.buildImage(
					{
						context: path.resolve(__dirname, '..', '..'),
						src: ['Dockerfile', ...result],
					},
					{ t: 'directus-test-image', buildargs: { NODE_VERSION }, cachefrom: '["directus-test-image"]' }
				);

				await new Promise((resolve, reject) => {
					docker.modem.followProgress(
						stream,
						(err: Error, res: any) => {
							if (err) {
								reject(err);
							} else {
								resolve(res);
							}
						},
						(event: any) => {
							if (event.stream?.startsWith('Step')) {
								task.output = event.stream;
							}
						}
					);
				});
			},
		},
		{
			title: 'Pulling Required Images',
			task: () => {
				return new Listr(
					vendors
						.map((vendor) => {
							return {
								title: config.names[vendor]!,
								task: async (_, task) => {
									const image =
										config.containerConfig[vendor]! &&
										(config.containerConfig[vendor]! as Dockerode.ContainerSpec).Image;

									if (!image) return;

									const stream = await docker.pull(image);

									await new Promise((resolve, reject) => {
										docker.modem.followProgress(
											stream,
											(err: Error, res: any) => {
												if (err) {
													reject(err);
												} else {
													resolve(res);
												}
											},
											(event: any) => {
												if (event.stream?.startsWith('Step')) {
													task.output = event.stream;
												}
											}
										);
									});
								},
							} as ListrTask;
						})
						.filter((t) => t),
					{ concurrent: true }
				);
			},
		},
		{
			title: 'Create Docker containers',
			task: () => {
				return new Listr(
					vendors.map((vendor) => {
						return {
							title: config.names[vendor]!,
							task: () => {
								return new Listr([
									{
										title: 'Database',
										task: async () => {
											if (!config.containerConfig[vendor] || config.containerConfig[vendor] === false) return;
											const container = await docker.createContainer(config.containerConfig[vendor]! as ContainerSpec);
											global.databaseContainers.push({
												vendor,
												container,
											});
										},
									},
									{
										title: 'Directus',
										task: async () => {
											const container = await docker.createContainer({
												name: `directus-test-directus-${vendor}-${process.pid}`,
												Image: 'directus-test-image',
												Env: [
													...config.envs[vendor]!,
													'ADMIN_EMAIL=admin@example.com',
													'ADMIN_PASSWORD=password',
													'KEY=directus-test',
													'SECRET=directus-test',
													'TELEMETRY=false',
												],
												HostConfig: {
													Links:
														vendor === 'sqlite3'
															? undefined
															: [
																	`directus-test-database-${vendor}-${process.pid}:directus-test-database-${vendor}-${process.pid}`,
															  ],
													PortBindings: {
														'8055/tcp': [{ HostPort: String(config.ports[vendor]!) }],
													},
												},
											} as ContainerSpec);

											global.directusContainers.push({
												vendor,
												container,
											});
										},
									},
								]);
							},
						};
					}),
					{ concurrent: true }
				);
			},
		},
		{
			title: 'Start Database Docker containers',
			task: () => {
				return new Listr(
					global.databaseContainers.map(({ vendor, container }) => {
						return {
							title: config.names[vendor]!,
							task: async () => await container.start(),
						};
					}),
					{ concurrent: true }
				);
			},
		},
		{
			title: 'Create Knex instances',
			task: () => {
				return new Listr(
					vendors.map((vendor) => {
						return {
							title: config.names[vendor]!,
							task: () => {
								global.knexInstances.push({ vendor, knex: knex(config.knexConfig[vendor]!) });
							},
						};
					}),
					{ concurrent: true }
				);
			},
		},
		{
			title: 'Wait for databases to be ready',
			task: async () => {
				return new Listr(
					global.knexInstances.map(({ vendor, knex }) => {
						return {
							title: config.names[vendor]!,
							task: async () => await awaitDatabaseConnection(knex, config.knexConfig[vendor]!.waitTestSQL),
						};
					}),
					{ concurrent: true }
				);
			},
		},
		{
			title: 'Close Knex instances',
			task: () => {
				return new Listr(
					global.knexInstances.map(({ vendor, knex }) => {
						return {
							title: config.names[vendor]!,
							task: async () => await knex.destroy(),
						};
					}),
					{ concurrent: true }
				);
			},
		},
		{
			title: 'Start Directus Docker containers',
			task: () => {
				return new Listr(
					global.directusContainers.map(({ vendor, container }) => {
						return {
							title: config.names[vendor]!,
							task: async () => await container.start(),
						};
					}),
					{ concurrent: true }
				);
			},
		},
		{
			title: 'Wait for Directus to be ready',
			task: async () => {
				return new Listr(
					vendors.map((vendor) => {
						return {
							title: config.names[vendor]!,
							task: async () => await awaitDirectusConnection(config.ports[vendor]!),
						};
					}),
					{ concurrent: true }
				);
			},
		},
		{
			skip: () => !jestConfig.watch,
			title: 'Persist container info',
			task: () => {
				const persistContainer = ({ container, vendor }: { container: Dockerode.Container; vendor: string }) => ({
					id: container.id,
					vendor,
				});
				const containers = {
					db: global.databaseContainers.map(persistContainer),
					directus: global.directusContainers.map(persistContainer),
				};
				writeFileSync(CONTAINER_PERSISTENCE_FILE, JSON.stringify(containers));
			},
		},
	]).run();

	console.log('\n');
};
