TYPE=VIEW
query=select if(`performance_schema`.`events_waits_summary_by_host_by_event_name`.`HOST` is null,\'background\',`performance_schema`.`events_waits_summary_by_host_by_event_name`.`HOST`) AS `host`,`performance_schema`.`events_waits_summary_by_host_by_event_name`.`EVENT_NAME` AS `event`,`performance_schema`.`events_waits_summary_by_host_by_event_name`.`COUNT_STAR` AS `total`,`performance_schema`.`events_waits_summary_by_host_by_event_name`.`SUM_TIMER_WAIT` AS `total_latency`,`performance_schema`.`events_waits_summary_by_host_by_event_name`.`AVG_TIMER_WAIT` AS `avg_latency`,`performance_schema`.`events_waits_summary_by_host_by_event_name`.`MAX_TIMER_WAIT` AS `max_latency` from `performance_schema`.`events_waits_summary_by_host_by_event_name` where `performance_schema`.`events_waits_summary_by_host_by_event_name`.`EVENT_NAME` <> \'idle\' and `performance_schema`.`events_waits_summary_by_host_by_event_name`.`SUM_TIMER_WAIT` > 0 order by if(`performance_schema`.`events_waits_summary_by_host_by_event_name`.`HOST` is null,\'background\',`performance_schema`.`events_waits_summary_by_host_by_event_name`.`HOST`),`performance_schema`.`events_waits_summary_by_host_by_event_name`.`SUM_TIMER_WAIT` desc
md5=6db496ac0e3e32dd8e3ca80c584f8ccd
updatable=1
algorithm=1
definer_user=mariadb.sys
definer_host=localhost
suid=0
with_check_option=0
timestamp=0001703231303093984
create-version=2
source=SELECT IF(host IS NULL, \'background\', host) AS host,\n       event_name AS event,\n       count_star AS total,\n       sum_timer_wait AS total_latency,\n       avg_timer_wait AS avg_latency,\n       max_timer_wait AS max_latency\n  FROM performance_schema.events_waits_summary_by_host_by_event_name\n WHERE event_name != \'idle\'\n   AND sum_timer_wait > 0\n ORDER BY host, sum_timer_wait DESC;
client_cs_name=utf8mb3
connection_cl_name=utf8mb3_general_ci
view_body_utf8=select if(`performance_schema`.`events_waits_summary_by_host_by_event_name`.`HOST` is null,\'background\',`performance_schema`.`events_waits_summary_by_host_by_event_name`.`HOST`) AS `host`,`performance_schema`.`events_waits_summary_by_host_by_event_name`.`EVENT_NAME` AS `event`,`performance_schema`.`events_waits_summary_by_host_by_event_name`.`COUNT_STAR` AS `total`,`performance_schema`.`events_waits_summary_by_host_by_event_name`.`SUM_TIMER_WAIT` AS `total_latency`,`performance_schema`.`events_waits_summary_by_host_by_event_name`.`AVG_TIMER_WAIT` AS `avg_latency`,`performance_schema`.`events_waits_summary_by_host_by_event_name`.`MAX_TIMER_WAIT` AS `max_latency` from `performance_schema`.`events_waits_summary_by_host_by_event_name` where `performance_schema`.`events_waits_summary_by_host_by_event_name`.`EVENT_NAME` <> \'idle\' and `performance_schema`.`events_waits_summary_by_host_by_event_name`.`SUM_TIMER_WAIT` > 0 order by if(`performance_schema`.`events_waits_summary_by_host_by_event_name`.`HOST` is null,\'background\',`performance_schema`.`events_waits_summary_by_host_by_event_name`.`HOST`),`performance_schema`.`events_waits_summary_by_host_by_event_name`.`SUM_TIMER_WAIT` desc
mariadb-version=101106
