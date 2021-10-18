/* eslint-disable no-console */
import { v4 as uuid } from 'uuid';
import { music, internet, name, datatype, lorem, address } from 'faker';
import { Knex } from 'knex';

type Guest = {
	id?: string;
	name: string;
	birthday: Date;
	search_radius: string;
	earliest_events_to_show: string;
	latest_events_to_show: string;
	password: string;
	shows_attended: number;
	favorite_artist?: number;
};

type Artist = {
	id?: number;
	name: string;
	members: string;
};

type Tour = {
	id?: number;
	route: string;
	map_of_stops: string;
	area_of_reach: string;
	revenue_estimated: bigint;
	revenue_of_shows_per_month: string;
};

type Organizer = {
	id?: number;
	name: string;
};

type Event = {
	id?: number;
	time: Date;
	description: string;
	cost: number;
	location: string;
	created_at: Date;
	tags: string;
};

type JoinTable = {
	id?: string;
	[key: string]: any;
};

type Item = Guest | Artist | Tour | Organizer | Event | JoinTable;

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

export type JoinTableOptions = {
	[key: string]: string | number;
};

export const seedTable = async function (
	database: Knex<any, unknown>,
	count: number,
	table: string,
	factory: Item | (() => Item),
	options?: SeedOptions
): Promise<void | any[] | any> {
	const row: Record<string, number> = {};
	if (typeof factory === 'object') {
		await database(table).insert(factory);
		row[table] = row[table]! + 1;
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
	members: JSON.stringify({ role: internet.userName() }),
});

export const createEvent = (): Event => ({
	cost: datatype.float(),
	description: lorem.paragraphs(2),
	location: getRandomGeoPoint(),
	created_at: randomDateTime(new Date(1030436120350), new Date(1633466120350)),
	time: randomDateTime(new Date(1030436120350), new Date(1633466120350)),
	tags: `tags
${music.genre()}
${music.genre()}
${music.genre()}
`,
});

export const createTour = (): Tour => ({
	route: getRandomGeoLineString(),
	map_of_stops: getRandomGeoMultiPoint(),
	area_of_reach: getRandomGeoMultiPolygon(),
	revenue_estimated: BigInt(getRandomInt(Number.MAX_SAFE_INTEGER)),
	revenue_of_shows_per_month: getRandomGeoMultiLineString(),
});

export const createGuest = (): Guest => ({
	id: uuid(),
	birthday: randomDateTime(new Date(1030436120350), new Date(1633466120350)),
	name: `${name.firstName()} ${name.lastName()}`,
	search_radius: getRandomGeoPolygon(),
	earliest_events_to_show: randomTime(),
	latest_events_to_show: randomTime(),
	password: getRandomString(32),
	shows_attended: datatype.number(),
});

export const createOrganizer = (): Organizer => ({
	name: `${name.firstName()} ${name.lastName()}`,
});

export const createMany = (factory: () => Item, count: number) => {
	const items: Item[] = [];
	for (let rows = 0; rows < count; rows++) {
		items.push(factory());
	}
	return items;
};

function getRandomInt(max: number) {
	return Math.floor(Math.random() * max);
}

function randomDateTime(start: Date, end: Date) {
	return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomTime() {
	const dateTime = randomDateTime(new Date(1030436120350), new Date(1633466120350)).toUTCString();
	return dateTime.substring(17, 25);
}

function getRandomGeoPoint() {
	const location = address.nearbyGPSCoordinate();
	return `SRID=4326;POINT(${location[0]} ${location[1]})`;
}
function getRandomGeoMultiPoint() {
	const location = address.nearbyGPSCoordinate();
	const location2 = address.nearbyGPSCoordinate();

	return `SRID=4326;MULTIPOINT(${location[0]} ${location[1]},${location2[0]} ${location2[1]})`;
}
function getRandomGeoLineString() {
	const location = address.nearbyGPSCoordinate();
	const location2 = address.nearbyGPSCoordinate();

	return `SRID=4326;LINESTRING(${location[0]} ${location[1]},${location2[0]} ${location2[1]})`;
}
function getRandomGeoMultiLineString() {
	const location = address.nearbyGPSCoordinate();
	const location2 = address.nearbyGPSCoordinate();
	const location3 = address.nearbyGPSCoordinate();
	const location4 = address.nearbyGPSCoordinate();
	const location5 = address.nearbyGPSCoordinate();
	return `SRID=4326;MULTILINESTRING((${location[0]} ${location[1]},${location2[0]} ${location2[1]}),(${location3[0]} ${location3[1]},${location4[0]} ${location4[1]},${location5[0]} ${location5[1]}))`;
}

function getRandomGeoPolygon() {
	const location = address.nearbyGPSCoordinate();
	const location2 = address.nearbyGPSCoordinate();
	const location3 = address.nearbyGPSCoordinate();
	const location4 = address.nearbyGPSCoordinate();
	const location5 = address.nearbyGPSCoordinate();

	return `SRID=4326;POLYGON((${location[0]} ${location[1]},${location2[0]} ${location2[1]},${location3[0]} ${location3[1]},${location4[0]} ${location4[1]},${location5[0]} ${location5[1]}))`;
}
function getRandomGeoMultiPolygon() {
	const location = address.nearbyGPSCoordinate();
	const location2 = address.nearbyGPSCoordinate();
	const location3 = address.nearbyGPSCoordinate();
	const location4 = address.nearbyGPSCoordinate();
	const location5 = address.nearbyGPSCoordinate();
	return `SRID=4326;MULTIPOLYGON(((${location[0]} ${location[1]},${location2[0]} ${location2[1]},${location3[0]} ${location3[1]},${location4[0]} ${location4[1]},${location5[0]} ${location5[1]})),((${location[0]} ${location[1]},${location2[0]} ${location2[1]},${location3[0]} ${location3[1]},${location4[0]} ${location4[1]},${location5[0]} ${location5[1]})))`;
}

function getRandomString(length: number) {
	const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
	}
	return result;
}
