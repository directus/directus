export interface Schema {
	categories: Categories[];
	operators: Operators[];
	singleton: Singleton;
	tracks: Tracks[];
	trains: Trains[];
	trains_operators_junction: TrainsOperatorsJunction[];
}

export interface Categories {
	id: number;
	name: string | null;
}

export interface Operators {
	id: number;
	name: string | null;
}

export interface Singleton {
	id: number;
	title: string | null;
}

export interface Tracks {
	id: number;
	from: string | null;
	to: string | null;
	train_id: number | Trains | null;
}

export interface Trains {
	id: number;
	name: string | null;
	operators: number[] | TrainsOperatorsJunction[];
	tracks: number[] | Tracks[];
	category: number | Categories | null;
}

export interface TrainsOperatorsJunction {
	id: number;
	trains_id: number | Trains | null;
	operators_id: number | Operators | null;
}
