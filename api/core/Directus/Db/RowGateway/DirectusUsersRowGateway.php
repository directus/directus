<?php

namespace Directus\Db\RowGateway;

use Directus\Auth\Provider as AuthProvider;
use Directus\Bootstrap;
use Directus\Db\TableGateway\AclAwareTableGateway;
use Directus\Util\DateUtils;
use Zend\Db\RowGateway\RowGateway;
use Zend\Db\Sql\Expression;

class DirectusUsersRowGateway extends AclAwareRowGateway {

    public function preSaveDataHook(array $rowData, $rowExistsInDatabase = false)
    {
        $log = Bootstrap::get('log');

        if(isset($rowData['id'])) {
            $logger = Bootstrap::get('log');
            $TableGateway = new AclAwareTableGateway($this->acl, $this->table, $this->sql->getAdapter());
            $dbRecord = $TableGateway->find($rowData['id']);
            if(false === $dbRecord) {
                // @todo is it better to throw an exception here?
                $rowExistsInDatabase = false;
            }
        }

        // User is updating themselves.
        // Corresponds to a ping indicating their last activity.
        // Updated their "last_access" value.
        if(AuthProvider::loggedIn()) {
            $currentUser = AuthProvider::getUserInfo();
            if(isset($rowData['id']) && $rowData['id'] == $currentUser['id']) {
                $rowData['last_access'] = DateUtils::now();
            }
        }

        return $rowData;
    }

}
