export type Schema = {
	city: City[];
	country: Country[];
	state: State[];
};
export type City = {
	id?: string | number;
	name?: string | number;
	state?: string | number | State;
};
export type Country = {
	id?: string | number;
	name?: string | number;
};
export type State = {
	id?: string | number;
	name?: string | number;
	country?: string | number | Country;
};
