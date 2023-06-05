/**
 * A package which can bee seen as middleware for SQL drivers.
 * Its purpose is to convert a very abstract query into a more SQL specific query.
 * However in this package aren't any assumptions made about an concrete SQL dialect.
 *
 * @remarks
 * This packages comes especially handy when it comes to converting abstract relationships.
 * It eliminates redundant logic for converting of abstract relationships into abstract SQL JOINs, which would otherwise be implemented in every SQL driver.
 *
 * @packageDocumentation
 */

export * from './statement.js';
