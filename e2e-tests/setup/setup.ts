import Dockerode, { ContainerSpec } from 'dockerode';
import { nanoid } from 'nanoid';
// import { seedDatabase } from './utils/seed';
import knex from 'knex';
import { awaitConnection } from './utils/await-connection';
import Listr from 'listr';

const docker = new Dockerode();

export default async () => {
	global.__containers__ = [];
	global.__databases__ = [];

	await new Listr([
		{
			title: 'Create Docker containers',
			task: () =>
				new Listr(
					[
						{
							title: 'Postgres',
							task: async () => {
								const container = await docker.createContainer({
									name: 'directus-test-' + nanoid(),
									Image: 'postgres:12-alpine',
									Env: ['POSTGRES_PASSWORD=secret', 'POSTGRES_DB=directus'],
									Tty: false,
									HostConfig: {
										PortBindings: {
											'5432/tcp': [{ HostPort: '5100' }],
										},
									},
								} as ContainerSpec);

								global.__containers__.push(container);
							},
						},
					],
					{ concurrent: true }
				),
		},
		{
			title: 'Start Docker containers',
			task: () =>
				new Listr(
					[
						{
							title: 'Postgres',
							task: async () => {
								await global.__containers__[0].start();
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
							task: async () => await awaitConnection(global.__databases__[0]),
						},
					],
					{ concurrent: true }
				),
		},
	]).run();

	console.log('\n');
};
