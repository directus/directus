declare module global {
	let __containers__: Dockerode.Container[];
	let __databases__: Knex[];
}
