export { JsonHelperPostgres_12 as postgres12 } from './dialects/postgres_12';
// export { JsonHelperPostgres_10 as postgres10 } from './dialects/postgres_10';
export { JsonHelperCockroachDB as cockroachdb } from './dialects/cockroach';
export { JsonHelperOracle_12 as oracle12 } from './dialects/oracle_12';
export { JsonHelperMySQL_5 as mysql5 } from './dialects/mysql_5';
export { JsonHelperMySQL_8 as mysql8 } from './dialects/mysql_8';
export { JsonHelperMariaDB as mariadb } from './dialects/mariadb';
export { JsonHelperMSSQL_13 as mssql13 } from './dialects/mssql_13'; // 2016
//export { JsonHelperMSSQL_16 as mssql16 } from './dialects/mssql_16'; // 2022
export { JsonHelperSQLite as sqlite } from './dialects/sqlite';
export { JsonHelperDefault as fallback } from './dialects/default';
