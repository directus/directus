/* eslint-disable no-console */
// import { v4 as uuid } from 'uuid';
import { music, internet, name, datatype, lorem /*, address */ } from 'faker';
import { Knex } from 'knex';

type Guest = {
	id?: string | number;
	name: string;
	birthday: Date;
	earliest_events_to_show: Date | string;
	latest_events_to_show: Date | string;
	password: string;
	shows_attended: number;
	favorite_artist?: number | Artist;
};

type Artist = {
	id?: number;
	name: string;
	members: string | Record<string, any>;
};

type Tour = {
	id?: number;
	revenue: bigint;
};

type Organizer = {
	id?: number;
	company_name: string;
};

type Event = {
	id?: number;
	time: string;
	description: string;
	cost: number;
	created_at: Date;
	tags: string;
};

type JoinTable = {
	[column: string]: number;
};

export type Item = Guest | Artist | Tour | Organizer | Event | JoinTable;

/*
 * Options Example: Artist
 * Select: ['name', 'members']
 * Where: ['id', 3]
 */

type SeedOptions = {
	select?: string[];
	where?: any[];
	raw?: string;
};

/* CreateManyOptions:
 * {column: countOfRelation}
 * EX: {favorites_artists: 45}
 * used for tying together relations randomly
 */

type CreateManyOptions = {
	[column: string]: number;
};

export const seedTable = async function (
	database: Knex<any, unknown>,
	count: number,
	table: string,
	factory: Item | (() => Item) | Item[],
	options?: SeedOptions
): Promise<void | any[] | any> {
	const row: Record<string, number> = {};
	if (Array.isArray(factory)) {
		await database.batchInsert(table, factory, 200);
	} else if (typeof factory === 'object') {
		if (count > 1) {
			try {
				const fakeRows = [];
				for (let i = 0; i < count; i++) {
					fakeRows.push(factory);
					row[table] = row[table]! + 1;
				}
				await database(table).insert(fakeRows);
			} catch (error: any) {
				throw new Error(error);
			}
		} else {
			await database(table).insert(factory);
			row[table] = row[table]! + 1;
		}
	} else if (count >= 200) {
		try {
			let fakeRows: any[] = [];
			for (let i = 0; i < count; i++) {
				fakeRows.push(factory());
				if (i % 200 === 0) {
					await database.batchInsert(table, fakeRows, 200);
					fakeRows = [];
				}
				row[table] = row[table]! + 1;
			}
			if (count - row[table]! < 200) {
				await database.batchInsert(table, fakeRows, 200);
				fakeRows = [];
			}
		} catch (error: any) {
			throw new Error(error);
		}
	} else {
		try {
			const fakeRows = [];
			for (let i = 0; i < count; i++) {
				fakeRows.push(factory());
				row[table] = row[table]! + 1;
			}
			await database(table).insert(fakeRows);
		} catch (error: any) {
			throw new Error(error);
		}
	}
	if (options) {
		const { select, where, raw } = options;
		if (raw) return await database.schema.raw(raw!);
		else if (where && select) return await database(table).select(select).where(where[0], where[1]);
		else return await database(table).select(select!);
	}
};

export const createArtist = (): Artist => ({
	name: internet.userName(),
	members: JSON.stringify({ guitar: internet.userName() }),
});

export const createEvent = (): Event => ({
	cost: datatype.float(),
	description: lorem.paragraphs(2),
	created_at: randomDateTime(new Date(1030436120350), new Date(1633466120350)),
	time: randomTime(),
	tags: `tags
${music.genre()}
${music.genre()}
${music.genre()}
`,
});

export const createTour = (): Tour => ({
	revenue: BigInt(getRandomInt(Number.MAX_SAFE_INTEGER)),
});

export const createGuest = (): Guest => ({
	// id: uuid(),
	birthday: randomDateTime(new Date(1030436120350), new Date(1633466120350)),
	name: `${name.firstName()} ${name.lastName()}`,
	earliest_events_to_show: randomTime(),
	latest_events_to_show: randomTime(),
	password: getRandomString(32),
	shows_attended: datatype.number(),
});

export const createOrganizer = (): Organizer => ({
	company_name: `${name.firstName()} ${name.lastName()}`,
});

export const createMany = (factory: (() => Item) | Record<string, any>, count: number, options?: CreateManyOptions) => {
	const items: Item[] = [];
	if (options && typeof factory !== 'object') {
		for (let rows = 0; rows < count; rows++) {
			const item: any = factory();
			for (const [column, max] of Object.entries(options)) {
				item[column] = getRandomInt(max);
			}
			items.push(item);
		}
		return items;
	}
	if (options && typeof factory === 'object') {
		for (let rows = 0; rows < count; rows++) {
			const item: any = factory;
			for (const [column, max] of Object.entries(options)) {
				item[column] = getRandomInt(max);
			}
			items.push(item);
		}
		return items;
	} else if (typeof factory !== 'object') {
		for (let rows = 0; rows < count; rows++) {
			items.push(factory());
		}
	}
	return items;
};

function getRandomInt(max: number) {
	let int = 0;
	while (int === 0) {
		int = Math.floor(Math.random() * max);
	}
	return int;
}

function randomDateTime(start: Date, end: Date) {
	return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomTime() {
	const dateTime = randomDateTime(new Date(1030436120350), new Date(1633466120350)).toUTCString();
	return dateTime.substring(17, 25);
}

function getRandomString(length: number) {
	const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
	}
	return result;
}
