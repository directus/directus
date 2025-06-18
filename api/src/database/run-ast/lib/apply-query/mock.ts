import { MockClient } from 'knex-mock-client';

// in order for the helpers to know the client type
export class Client_SQLite3 extends MockClient {}
