export interface Schema {
	city: City[];
	country: Country[];
	state: State[];
}

export interface City {
	id: number;
	name: string | null;
	state: number | State | null;
}

export interface Country {
	id: number;
	name: string | null;
}

export interface State {
	id: number;
	name: string | null;
	country: number | Country | null;
}
