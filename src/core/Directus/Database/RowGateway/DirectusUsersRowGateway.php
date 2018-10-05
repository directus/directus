<?php

namespace Directus\Database\RowGateway;

use Directus\Database\TableGateway\BaseTableGateway;
use Directus\Util\DateTimeUtils;

class DirectusUsersRowGateway extends BaseRowGateway
{
    public function preSaveDataHook(array $rowData, $rowExistsInDatabase = false)
    {
        if (isset($rowData['id'])) {
            $TableGateway = new BaseTableGateway($this->table, $this->sql->getAdapter(), $this->acl);
            $dbRecord = $TableGateway->find($rowData['id']);
            if (false === $dbRecord) {
                // @todo is it better to throw an exception here?
                $rowExistsInDatabase = false;
            }
        }

        // User is updating themselves.
        // Corresponds to a ping indicating their last activity.
        // Updated their "last_access" value.
        if ($this->acl) {
            if (isset($rowData['id']) && $rowData['id'] == $this->acl->getUserId()) {
                $rowData['last_access_on'] = DateTimeUtils::nowInUTC()->toString();
            }
        }

        return $rowData;
    }

}
