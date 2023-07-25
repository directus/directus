/**
 * A package which can bee seen as middleware for SQL drivers.
 * It's purpose is to convert a very abstract query into a more SQL specific query, but still being neutral to SQL dialects.
 *
 * @remarks
 * This package eliminates redundant logic in the drivers, since some operation are needed for every SQL driver.
 * This comes especially handy regarding converting abstract relationships into actual JOINs.
 * Another important part here is the conversion of actual, explicit value into a separate list of parameters to prevent SQL injection in each SQL driver.
 *
 * However, the techniques being used can diver from driver to driver.
 * For some drivers it might for example be more efficient to use sub queries instead of JOINs.
 * Therefore this abstract SQL might need to be slightly more abstract in the future.
 *
 *  @packageDocumentation
 */

export * from './converter/index.js';
export * from './types/index.js';
export { expand } from './utils/expand.js';
export { convertNumericOperators } from './utils/numeric-operator-conversion.js';
