TYPE=VIEW
query=select `sslver`.`THREAD_ID` AS `thread_id`,`sslver`.`VARIABLE_VALUE` AS `ssl_version`,`sslcip`.`VARIABLE_VALUE` AS `ssl_cipher`,`sslreuse`.`VARIABLE_VALUE` AS `ssl_sessions_reused` from ((`performance_schema`.`status_by_thread` `sslver` left join `performance_schema`.`status_by_thread` `sslcip` on(`sslcip`.`THREAD_ID` = `sslver`.`THREAD_ID` and `sslcip`.`VARIABLE_NAME` = \'Ssl_cipher\')) left join `performance_schema`.`status_by_thread` `sslreuse` on(`sslreuse`.`THREAD_ID` = `sslver`.`THREAD_ID` and `sslreuse`.`VARIABLE_NAME` = \'Ssl_sessions_reused\')) where `sslver`.`VARIABLE_NAME` = \'Ssl_version\'
md5=888bde4bd747f7df3ec788d97818af55
updatable=0
algorithm=1
definer_user=mariadb.sys
definer_host=localhost
suid=0
with_check_option=0
timestamp=0001703231303106405
create-version=2
source=SELECT sslver.thread_id,\n       sslver.variable_value ssl_version,\n       sslcip.variable_value ssl_cipher,\n       sslreuse.variable_value ssl_sessions_reused\n  FROM performance_schema.status_by_thread sslver\n  LEFT JOIN performance_schema.status_by_thread sslcip\n    ON (sslcip.thread_id=sslver.thread_id and sslcip.variable_name=\'Ssl_cipher\')\n  LEFT JOIN performance_schema.status_by_thread sslreuse\n    ON (sslreuse.thread_id=sslver.thread_id and sslreuse.variable_name=\'Ssl_sessions_reused\')\n WHERE sslver.variable_name=\'Ssl_version\';
client_cs_name=utf8mb3
connection_cl_name=utf8mb3_general_ci
view_body_utf8=select `sslver`.`THREAD_ID` AS `thread_id`,`sslver`.`VARIABLE_VALUE` AS `ssl_version`,`sslcip`.`VARIABLE_VALUE` AS `ssl_cipher`,`sslreuse`.`VARIABLE_VALUE` AS `ssl_sessions_reused` from ((`performance_schema`.`status_by_thread` `sslver` left join `performance_schema`.`status_by_thread` `sslcip` on(`sslcip`.`THREAD_ID` = `sslver`.`THREAD_ID` and `sslcip`.`VARIABLE_NAME` = \'Ssl_cipher\')) left join `performance_schema`.`status_by_thread` `sslreuse` on(`sslreuse`.`THREAD_ID` = `sslver`.`THREAD_ID` and `sslreuse`.`VARIABLE_NAME` = \'Ssl_sessions_reused\')) where `sslver`.`VARIABLE_NAME` = \'Ssl_version\'
mariadb-version=101106
