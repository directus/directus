export type Collection = {
	collection: string;
	note: string | null;
	hidden: boolean;
	single: boolean;
	icon: string | null;
	translation: Record<string, string>;
};
