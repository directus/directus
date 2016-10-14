<?php

namespace Directus\Db\RowGateway;

use Directus\Auth\Provider as AuthProvider;
use Directus\Bootstrap;
use Directus\Db\TableGateway\BaseTableGateway;
use Directus\Util\DateUtils;

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
                $rowData['last_access'] = DateUtils::now();
            }
        }

        return $rowData;
    }

}
