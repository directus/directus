import { hostname } from 'node:os';

export const getLockName = () => `sync-extensions/${hostname}`;
