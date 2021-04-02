import { Knex } from 'knex';

export async function awaitConnection(database: Knex, currentAttempt: number = 0) {
	try {
		await database.select(1);
	} catch {
		console.log(`Couldn't connect to database. Trying again in 5 seconds...`);

		if (currentAttempt === 10) {
			throw new Error('Couldnt connect to DB');
		}

		return new Promise((resolve) => {
			setTimeout(async () => {
				await awaitConnection(database, currentAttempt + 1);
				resolve(null);
			}, 5000);
		});
	}
}
