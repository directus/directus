export interface Table {
  name: string;

  // Not supported in SQLite + comment in mssql
  comment?: string | null;
  schema?: string;

  // MySQL Only
  collation?: string;
  engine?: string;

  // Postgres Only
  owner?: string;

  // SQLite Only
  sql?: string;

  //MSSQL only
  catalog?: string;
}
