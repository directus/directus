import { Knex } from 'knex';
import axios from 'axios';

export async function awaitDatabaseConnection(database: Knex, currentAttempt: number = 0) {
	try {
		await database.select(1);
	} catch {
		if (currentAttempt === 10) {
			throw new Error('Couldnt connect to DB');
		}

		return new Promise((resolve) => {
			setTimeout(async () => {
				await awaitDatabaseConnection(database, currentAttempt + 1);
				resolve(null);
			}, 5000);
		});
	}
}

export async function awaitDirectusConnection(port: number = 6100, currentAttempt: number = 0) {
	try {
		await axios.get(`http://localhost:${port}/server/ping`);
	} catch {
		if (currentAttempt === 10) {
			throw new Error('Couldnt connect to Directus');
		}

		return new Promise((resolve) => {
			setTimeout(async () => {
				await awaitDirectusConnection(port, currentAttempt + 1);
				resolve(null);
			}, 5000);
		});
	}
}
