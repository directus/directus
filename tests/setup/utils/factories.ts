import { v4 as uuid } from 'uuid';
import { random } from 'lodash';
import { Knex } from 'knex';

type Guest = {
	id: string;
	name: string;
	birthday: Date;
	earliest_events_to_show: Date | string;
	latest_events_to_show: Date | string;
	password: string;
	shows_attended: number;
	favorite_artist?: string | Artist;
};

type Artist = {
	id: string;
	name: string;
	members: string | Record<string, any>;
};

type Tour = {
	id: string;
	revenue: bigint;
};

type Organizer = {
	id: string;
	company_name: string;
};

type Event = {
	id: string;
	time: Date;
	description: string;
	cost: number;
	created_at: Date;
	tags: string;
};

type JoinTable = {
	[column: string]: number | string;
};

export type Item = Guest | Artist | Tour | Organizer | Event | JoinTable;

/*
 * Options Example: Artist
 * Select: ['name', 'members']
 * Where: ['id', uuid]
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
	[column: string]: string | (() => unknown);
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
		await database(table).insert(factory);
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

const artists = [
	'The Vines',
	'Queens of the Stone Age',
	'The Vaccines',
	'Black Pistol Fire',
	'The White Stripes',
	'White Lies',
	'Sonic Youth',
	'Razorlight',
	'Ron Gallo',
	'Black Rebel Motorcycle Club',
];

const guitarBrands = ['gibson', 'fender', 'prs', 'rickenbacker', 'ibanez', 'jackson'];

export const createArtist = (): Artist => ({
	id: uuid(),
	name: artists[random(0, artists.length - 1)],
	members: JSON.stringify({ guitar: guitarBrands[random(0, guitarBrands.length - 1)] }),
});

const genres = ['rock', 'folk', 'electronic', 'musical', 'pop', 'jazz', 'metal', 'dance', 'blues', 'country'];

export const createEvent = (): Event => ({
	id: uuid(),
	cost: 1504.04,
	description: `Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.`,
	created_at: randomDateTime(),
	time: randomDateTime(),
	tags: `tags
${genres[random(0, genres.length - 1)]}
${genres[random(0, genres.length - 1)]}
${genres[random(0, genres.length - 1)]}
`,
});

export const createTour = (): Tour => ({
	id: uuid(),
	revenue: BigInt(getRandomInt(Number.MAX_SAFE_INTEGER)),
});

export const createGuest = (): Guest => ({
	id: uuid(),
	birthday: randomDateTime(),
	name: randomName(),
	earliest_events_to_show: randomDateTime(),
	latest_events_to_show: randomDateTime(),
	password: getRandomString(32),
	shows_attended: random(1, 35),
});

export const createOrganizer = (): Organizer => ({
	id: uuid(),
	company_name: randomName(),
});

export const createMany = (factory: (() => Item) | Record<string, any>, count: number, options?: CreateManyOptions) => {
	const items: Item[] = [];
	if (options && typeof factory !== 'object') {
		for (let rows = 0; rows < count; rows++) {
			const item: any = factory();
			for (const [column, value] of Object.entries(options)) {
				if (typeof value === 'string') {
					item[column] = value;
				} else {
					item[column] = value();
				}
			}
			items.push(item);
		}
	} else if (typeof factory !== 'object') {
		for (let rows = 0; rows < count; rows++) {
			items.push(factory());
		}
	} else {
		for (let rows = 0; rows < count; rows++) {
			const item: any = factory;
			for (const [column, value] of Object.entries(options!)) {
				if (typeof value === 'string') {
					item[column] = value;
				} else {
					item[column] = value();
				}
				items.push(item);
			}
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

function randomName() {
	const firstNames = [
		'James',
		'Mary',
		'Robert',
		'Patricia',
		'John',
		'Jennifer',
		'Michael',
		'Linda',
		'William',
		'Elizabeth',
		'David',
		'Barbara',
	];

	const lastNames = [
		'Smith',
		'Johnson',
		'Williams',
		'Brown',
		'Jones',
		'Garcia',
		'Miller',
		'Davis',
		'Rodriguez',
		'Martinez',
		'Hernandez',
	];

	return `${firstNames[random(0, firstNames.length - 1)]} ${lastNames[random(0, lastNames.length - 1)]}`;
}

function randomDateTime(start = new Date(1030436120350), end = new Date(1633466120350)) {
	return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getRandomString(length: number) {
	const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
	}
	return result;
}
