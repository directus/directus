import { Knex } from 'knex';
import axios from 'axios';

export async function awaitDatabaseConnection(
	database: Knex,
	checkSQL: string,
	currentAttempt = 0
): Promise<void | null> {
	try {
		await database.raw(checkSQL);
	} catch {
		if (currentAttempt === 10) {
			throw new Error(`Couldn't connect to DB`);
		}

		return new Promise((resolve) => {
			setTimeout(async () => {
				await awaitDatabaseConnection(database, checkSQL, currentAttempt + 1);
				resolve(null);
			}, 5000);
		});
	}
}

export async function awaitDirectusConnection(port = 6100, currentAttempt = 0): Promise<void | null> {
	try {
		await axios.get(`http://localhost:${port}/server/ping`);
	} catch {
		if (currentAttempt === 10) {
			throw new Error(`Couldn't connect to Directus`);
		}

		return new Promise((resolve) => {
			setTimeout(async () => {
				await awaitDirectusConnection(port, currentAttempt + 1);
				resolve(null);
			}, 5000);
		});
	}
}
