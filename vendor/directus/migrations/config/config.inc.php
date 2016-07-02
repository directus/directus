<?php

//--------------------------------------------
//Overall file system configuration paths
//--------------------------------------------

//These might already be defined, so wrap them in checks

// DB table where the version info is stored
if (!defined('RUCKUSING_SCHEMA_TBL_NAME')) {
    define('RUCKUSING_SCHEMA_TBL_NAME', 'schema_info');
}

if (!defined('RUCKUSING_TS_SCHEMA_TBL_NAME')) {
    define('RUCKUSING_TS_SCHEMA_TBL_NAME', 'schema_migrations');
}
