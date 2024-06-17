TYPE=VIEW
query=select `performance_schema`.`table_io_waits_summary_by_index_usage`.`OBJECT_SCHEMA` AS `object_schema`,`performance_schema`.`table_io_waits_summary_by_index_usage`.`OBJECT_NAME` AS `object_name`,`performance_schema`.`table_io_waits_summary_by_index_usage`.`INDEX_NAME` AS `index_name` from `performance_schema`.`table_io_waits_summary_by_index_usage` where `performance_schema`.`table_io_waits_summary_by_index_usage`.`INDEX_NAME` is not null and `performance_schema`.`table_io_waits_summary_by_index_usage`.`COUNT_STAR` = 0 and `performance_schema`.`table_io_waits_summary_by_index_usage`.`OBJECT_SCHEMA` <> \'mysql\' and `performance_schema`.`table_io_waits_summary_by_index_usage`.`INDEX_NAME` <> \'PRIMARY\' order by `performance_schema`.`table_io_waits_summary_by_index_usage`.`OBJECT_SCHEMA`,`performance_schema`.`table_io_waits_summary_by_index_usage`.`OBJECT_NAME`
md5=fcec883d9422ee0089c8d60c48eb8238
updatable=1
algorithm=1
definer_user=mariadb.sys
definer_host=localhost
suid=0
with_check_option=0
timestamp=0001703231303039212
create-version=2
source=SELECT object_schema,\n       object_name,\n       index_name\n  FROM performance_schema.table_io_waits_summary_by_index_usage\n WHERE index_name IS NOT NULL\n   AND count_star = 0\n   AND object_schema != \'mysql\'\n   AND index_name != \'PRIMARY\'\n ORDER BY object_schema, object_name;
client_cs_name=utf8mb3
connection_cl_name=utf8mb3_general_ci
view_body_utf8=select `performance_schema`.`table_io_waits_summary_by_index_usage`.`OBJECT_SCHEMA` AS `object_schema`,`performance_schema`.`table_io_waits_summary_by_index_usage`.`OBJECT_NAME` AS `object_name`,`performance_schema`.`table_io_waits_summary_by_index_usage`.`INDEX_NAME` AS `index_name` from `performance_schema`.`table_io_waits_summary_by_index_usage` where `performance_schema`.`table_io_waits_summary_by_index_usage`.`INDEX_NAME` is not null and `performance_schema`.`table_io_waits_summary_by_index_usage`.`COUNT_STAR` = 0 and `performance_schema`.`table_io_waits_summary_by_index_usage`.`OBJECT_SCHEMA` <> \'mysql\' and `performance_schema`.`table_io_waits_summary_by_index_usage`.`INDEX_NAME` <> \'PRIMARY\' order by `performance_schema`.`table_io_waits_summary_by_index_usage`.`OBJECT_SCHEMA`,`performance_schema`.`table_io_waits_summary_by_index_usage`.`OBJECT_NAME`
mariadb-version=101106
