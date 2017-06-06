<?php

namespace Directus\Config;

use Directus\Collection\Collection;
use Directus\Util\ArrayUtils;

class Config extends Collection implements ConfigInterface
{
    /**
     * Get a list of published statuses
     *
     * @return array
     */
    public function getPublishedStatuses()
    {
        $statusMapping = $this->get('statusMapping', []);
        $visibleStatus = [];

        foreach ($statusMapping as $value => $status) {
            $isPublished = ArrayUtils::get($status, 'published', false);

            if (is_array($status) && $isPublished) {
                $visibleStatus[] = $value;
            }
        }

        if (empty($visibleStatus)) {
            $visibleStatus[] = defined('STATUS_ACTIVE_NUM') ? STATUS_ACTIVE_NUM : 1;
        }

        return $visibleStatus;
    }
}
