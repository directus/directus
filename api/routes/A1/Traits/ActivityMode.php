<?php

namespace Directus\API\Routes\A1\Traits;

use Directus\Database\TableGateway\RelationalTableGateway;

trait ActivityMode
{
    public function getActivityMode()
    {
        $activityLoggingEnabled = !(isset($_GET['skip_activity_log']) && (1 == $_GET['skip_activity_log']));
        return $activityLoggingEnabled ? RelationalTableGateway::ACTIVITY_ENTRY_MODE_PARENT : RelationalTableGateway::ACTIVITY_ENTRY_MODE_DISABLED;
    }

}
