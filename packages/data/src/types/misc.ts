export type AtLeastOneElement<T> = [T, ...T[]];

/**
 * The dynamic relational information for a2o which is stored in the database.
 */
export type A2ORelation = {
	/** One or multiple foreign key relations */
	foreignKey: AtLeastOneElement<string | number>;

	/** The related collection */
	foreignCollection: string;
};
