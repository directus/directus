// This file is used to prevent circular dependencies issues between ItemsService <-> ActivityService / RevisionsService
// Context: https://github.com/directus/directus/issues/5453
// Pattern: https://medium.com/visual-development/how-to-fix-nasty-circular-dependency-issues-once-and-for-all-in-javascript-typescript-a04c987cf0de
export * from './items';
export * from './activity';
export * from './revisions';
