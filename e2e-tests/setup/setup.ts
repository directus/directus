import Dockerode, { ContainerSpec } from 'dockerode';
import knex, { Knex } from 'knex';
import { awaitDatabaseConnection, awaitDirectusConnection } from './utils/await-connection';
import Listr from 'listr';
import { getDBsToTest } from './utils/get-dbs-to-test';
import config from '../config';

declare module global {
	let __containers__: Dockerode.Container[];
	let __databases__: Knex[];
}

const docker = new Dockerode();

export default async () => {
	console.log('\n\n');

	console.log(`👮‍♀️ Start testing!\n`);

	global.__containers__ = [];
	global.__databases__ = [];

	const vendors = getDBsToTest();

	console.log(vendors, config);

	await new Listr([
		{
			title: 'Create Docker containers',
			task: () =>
				new Listr([
					{
						title: 'Postgres',
						task: () => {
							return new Listr([
								{
									title: 'Database',
									task: async () => {
										const container = await docker.createContainer({
											name: 'directus-test-postgres',
											Image: 'postgres:12-alpine',
											Hostname: 'directus-test-postgres',
											Env: ['POSTGRES_PASSWORD=secret', 'POSTGRES_DB=directus'],
											HostConfig: {
												PortBindings: {
													'5432/tcp': [{ HostPort: '5100' }],
												},
											},
										} as ContainerSpec);

										global.__containers__.push(container);
									},
								},
								{
									title: 'Directus',
									task: async () => {
										const directus = await docker.createContainer({
											name: 'directus-directus-directus',
											Image: 'directus-e2e',
											Env: [
												'DB_CLIENT=pg',
												'DB_HOST=directus-test-postgres',
												'DB_USER=postgres',
												'DB_PASSWORD=secret',
												'DB_PORT=5432',
												'DB_DATABASE=directus',
												'ADMIN_EMAIL=admin@example.com',
												'ADMIN_PASSWORD=password',
												'KEY=directus-test',
												'SECRET=directus-test',
												'TELEMETRY=false',
											],
											HostConfig: {
												Links: ['directus-test-postgres:directus-test-postgres'],
												PortBindings: {
													'8055/tcp': [{ HostPort: '6100' }],
												},
											},
										} as ContainerSpec);

										global.__containers__.push(directus);
									},
								},
							]);
						},
					},
				]),
		},
		{
			title: 'Start Database Docker containers',
			task: () =>
				new Listr(
					[
						{
							title: 'Postgres',
							task: async () => {
								await global.__containers__[0]!.start();
							},
						},
					],
					{ concurrent: true }
				),
		},
		{
			title: 'Create Knex instances',
			task: () =>
				new Listr(
					[
						{
							title: 'Postgres',
							task: () => {
								global.__databases__.push(
									knex({
										client: 'pg',
										connection: {
											host: 'localhost',
											port: 5100,
											database: 'directus',
											user: 'postgres',
											password: 'secret',
										},
									})
								);
							},
						},
					],
					{ concurrent: true }
				),
		},
		{
			title: 'Wait for databases to be ready',
			task: async () =>
				new Listr(
					[
						{
							title: 'Postgres',
							task: async () => await awaitDatabaseConnection(global.__databases__[0]!),
						},
					],
					{ concurrent: true }
				),
		},
		{
			title: 'Start Directus Docker containers',
			task: () =>
				new Listr(
					[
						{
							title: 'Postgres',
							task: async () => {
								await global.__containers__[1]!.start();
							},
						},
					],
					{ concurrent: true }
				),
		},
		{
			title: 'Wait for Directus to be ready',
			task: async () => await awaitDirectusConnection(),
		},
	]).run();

	console.log('\n');
};
