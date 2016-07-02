<?php

namespace Ruckusing;

use Ruckusing\Util\Logger as Ruckusing_Util_Logger;

interface FrameworkInterface
{
    public function __construct($config, $argv, Ruckusing_Util_Logger $log);
    public function execute();
    public function get_adapter();
    public function init_tasks();
    public function migrations_directory($key);
    public function migrations_directories();
    public function db_directory();
    public function initialize_db();
    public function initialize_logger();
    public function update_schema_for_timestamps();
}