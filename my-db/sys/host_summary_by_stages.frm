TYPE=VIEW
query=select if(`performance_schema`.`events_stages_summary_by_host_by_event_name`.`HOST` is null,\'background\',`performance_schema`.`events_stages_summary_by_host_by_event_name`.`HOST`) AS `host`,`performance_schema`.`events_stages_summary_by_host_by_event_name`.`EVENT_NAME` AS `event_name`,`performance_schema`.`events_stages_summary_by_host_by_event_name`.`COUNT_STAR` AS `total`,`sys`.`format_time`(`performance_schema`.`events_stages_summary_by_host_by_event_name`.`SUM_TIMER_WAIT`) AS `total_latency`,`sys`.`format_time`(`performance_schema`.`events_stages_summary_by_host_by_event_name`.`AVG_TIMER_WAIT`) AS `avg_latency` from `performance_schema`.`events_stages_summary_by_host_by_event_name` where `performance_schema`.`events_stages_summary_by_host_by_event_name`.`SUM_TIMER_WAIT` <> 0 order by if(`performance_schema`.`events_stages_summary_by_host_by_event_name`.`HOST` is null,\'background\',`performance_schema`.`events_stages_summary_by_host_by_event_name`.`HOST`),`performance_schema`.`events_stages_summary_by_host_by_event_name`.`SUM_TIMER_WAIT` desc
md5=9470b3b8680026f46359805c2e55231f
updatable=1
algorithm=1
definer_user=mariadb.sys
definer_host=localhost
suid=0
with_check_option=0
timestamp=0001703231303080279
create-version=2
source=SELECT IF(host IS NULL, \'background\', host) AS host,\n       event_name,\n       count_star AS total,\n       sys.format_time(sum_timer_wait) AS total_latency,\n       sys.format_time(avg_timer_wait) AS avg_latency\n  FROM performance_schema.events_stages_summary_by_host_by_event_name\n WHERE sum_timer_wait != 0\n ORDER BY IF(host IS NULL, \'background\', host), sum_timer_wait DESC;
client_cs_name=utf8mb3
connection_cl_name=utf8mb3_general_ci
view_body_utf8=select if(`performance_schema`.`events_stages_summary_by_host_by_event_name`.`HOST` is null,\'background\',`performance_schema`.`events_stages_summary_by_host_by_event_name`.`HOST`) AS `host`,`performance_schema`.`events_stages_summary_by_host_by_event_name`.`EVENT_NAME` AS `event_name`,`performance_schema`.`events_stages_summary_by_host_by_event_name`.`COUNT_STAR` AS `total`,`sys`.`format_time`(`performance_schema`.`events_stages_summary_by_host_by_event_name`.`SUM_TIMER_WAIT`) AS `total_latency`,`sys`.`format_time`(`performance_schema`.`events_stages_summary_by_host_by_event_name`.`AVG_TIMER_WAIT`) AS `avg_latency` from `performance_schema`.`events_stages_summary_by_host_by_event_name` where `performance_schema`.`events_stages_summary_by_host_by_event_name`.`SUM_TIMER_WAIT` <> 0 order by if(`performance_schema`.`events_stages_summary_by_host_by_event_name`.`HOST` is null,\'background\',`performance_schema`.`events_stages_summary_by_host_by_event_name`.`HOST`),`performance_schema`.`events_stages_summary_by_host_by_event_name`.`SUM_TIMER_WAIT` desc
mariadb-version=101106
