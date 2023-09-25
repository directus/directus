/**
 * A package which can bee seen as middleware for SQL drivers.
 * Its purpose is to convert a very abstract query into a more SQL specific query.
 * However in this package aren't any assumptions made about an concrete SQL dialect.
 *
 * @remarks
 * This packages comes in handy especially regarding converting abstract relationships into actual JOINs.
 * It eliminates redundant logic since this would otherwise be implemented in every SQL driver.
 *
 * @packageDocumentation
 */

export * from './converter/index.js';
export * from './types.js';
