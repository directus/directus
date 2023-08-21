/**
 * A set of types which form the abstract SQL query.
 * It's still neutral to concrete SQL dialects and databases but provides to SQL drivers with a query type that they can more easy work with.
 *
 * The major differences between the abstract query and the SQL query are:
 * - Abstract relationships are converted into actual JOINs.
 * - Explicit values which are provided in the abstract query are added to a list of parameters in the abstract SQL query to prevent SQL injection.
 *
 * @remarks
 * Besides the different syntax of each SQL dialect, it's also important to mention that SQL databases vary regarding the technique to use to receive data.
 * For example, for some drivers it's be more efficient to use sub queries, for others it's better to use JOINs.
 *
 * @module
 */

export * from './abstract-sql-query.js';
