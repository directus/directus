TYPE=VIEW
query=select if(locate(\'.\',`ibp`.`TABLE_NAME`) = 0,\'InnoDB System\',replace(substring_index(`ibp`.`TABLE_NAME`,\'.\',1),\'`\',\'\')) AS `object_schema`,`sys`.`format_bytes`(sum(if(`ibp`.`COMPRESSED_SIZE` = 0,16384,`ibp`.`COMPRESSED_SIZE`))) AS `allocated`,`sys`.`format_bytes`(sum(`ibp`.`DATA_SIZE`)) AS `data`,count(`ibp`.`PAGE_NUMBER`) AS `pages`,count(if(`ibp`.`IS_HASHED` = \'YES\',1,NULL)) AS `pages_hashed`,count(if(`ibp`.`IS_OLD` = \'YES\',1,NULL)) AS `pages_old`,round(sum(`ibp`.`NUMBER_RECORDS`) / count(distinct `ibp`.`INDEX_NAME`),0) AS `rows_cached` from `information_schema`.`innodb_buffer_page` `ibp` where `ibp`.`TABLE_NAME` is not null group by if(locate(\'.\',`ibp`.`TABLE_NAME`) = 0,\'InnoDB System\',replace(substring_index(`ibp`.`TABLE_NAME`,\'.\',1),\'`\',\'\')) order by sum(if(`ibp`.`COMPRESSED_SIZE` = 0,16384,`ibp`.`COMPRESSED_SIZE`)) desc
md5=178653a8e67a4b42359c7a859d5b8410
updatable=0
algorithm=2
definer_user=mariadb.sys
definer_host=localhost
suid=0
with_check_option=0
timestamp=0001703231302971216
create-version=2
source=SELECT IF(LOCATE(\'.\', ibp.table_name) = 0, \'InnoDB System\', REPLACE(SUBSTRING_INDEX(ibp.table_name, \'.\', 1), \'`\', \'\')) AS object_schema,\n       sys.format_bytes(SUM(IF(ibp.compressed_size = 0, 16384, compressed_size))) AS allocated,\n       sys.format_bytes(SUM(ibp.data_size)) AS data,\n       COUNT(ibp.page_number) AS pages,\n       COUNT(IF(ibp.is_hashed = \'YES\', 1, NULL)) AS pages_hashed,\n       COUNT(IF(ibp.is_old = \'YES\', 1, NULL)) AS pages_old,\n       ROUND(SUM(ibp.number_records)/COUNT(DISTINCT ibp.index_name)) AS rows_cached\n  FROM information_schema.innodb_buffer_page ibp\n WHERE table_name IS NOT NULL\n GROUP BY object_schema\n ORDER BY SUM(IF(ibp.compressed_size = 0, 16384, compressed_size)) DESC;
client_cs_name=utf8mb3
connection_cl_name=utf8mb3_general_ci
view_body_utf8=select if(locate(\'.\',`ibp`.`TABLE_NAME`) = 0,\'InnoDB System\',replace(substring_index(`ibp`.`TABLE_NAME`,\'.\',1),\'`\',\'\')) AS `object_schema`,`sys`.`format_bytes`(sum(if(`ibp`.`COMPRESSED_SIZE` = 0,16384,`ibp`.`COMPRESSED_SIZE`))) AS `allocated`,`sys`.`format_bytes`(sum(`ibp`.`DATA_SIZE`)) AS `data`,count(`ibp`.`PAGE_NUMBER`) AS `pages`,count(if(`ibp`.`IS_HASHED` = \'YES\',1,NULL)) AS `pages_hashed`,count(if(`ibp`.`IS_OLD` = \'YES\',1,NULL)) AS `pages_old`,round(sum(`ibp`.`NUMBER_RECORDS`) / count(distinct `ibp`.`INDEX_NAME`),0) AS `rows_cached` from `information_schema`.`innodb_buffer_page` `ibp` where `ibp`.`TABLE_NAME` is not null group by if(locate(\'.\',`ibp`.`TABLE_NAME`) = 0,\'InnoDB System\',replace(substring_index(`ibp`.`TABLE_NAME`,\'.\',1),\'`\',\'\')) order by sum(if(`ibp`.`COMPRESSED_SIZE` = 0,16384,`ibp`.`COMPRESSED_SIZE`)) desc
mariadb-version=101106
