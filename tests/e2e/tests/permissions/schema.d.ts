export type Schema = {
	categories: Categories[];
	operators: Operators[];
	tracks: Tracks[];
	trains: Trains[];
	trains_operators: TrainsOperators[];
};
export type Categories = {
	id?: string | number;
	name?: string | number;
};
export type Operators = {
	id?: string | number;
	name?: string | number;
};
export type Tracks = {
	id?: string | number;
	train_id?: string | number | Trains;
	from?: string | number;
	to?: string | number;
};
export type Trains = {
	id?: string | number;
	name?: string | number;
	operators: (string | number | TrainsOperators)[];
	tracks: (string | number | Tracks)[];
	category?: string | number | Categories;
};
export type TrainsOperators = {
	id?: string | number;
	trains_id?: string | number | Trains;
	operators_id?: string | number | Operators;
};
