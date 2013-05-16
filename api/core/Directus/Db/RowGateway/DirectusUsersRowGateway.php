<?php

namespace Directus\Db\RowGateway;

use Directus\Auth\Provider as AuthProvider;
use Directus\Bootstrap;
use Directus\Db\TableGateway\AclAwareTableGateway;
use Zend\Db\RowGateway\RowGateway;
use Zend\Db\Sql\Expression;

class DirectusUsersRowGateway extends AclAwareRowGateway {

    public function preSaveDataHook(array $rowData, $rowExistsInDatabase = false)
    {
        $log = Bootstrap::get('log');


        // // transitional:
        // // - until we have backend form validation, strip out empty password fields
        // if(isset($rowData['password']) && empty($rowData['password']))
        //     unset($rowData['password']);

        // tmp password hack. see /api.php
        if(isset($rowData['password']))
            unset($rowData['password']);

        if(isset($rowData['id'])) {
            $logger = Bootstrap::get('log');
            $TableGateway = new AclAwareTableGateway($this->acl, $this->table, $this->sql->getAdapter());
            $dbRecord = $TableGateway->find($rowData['id']);
            if(false === $dbRecord) {
                // @todo is it better to throw an exception here?
                $rowExistsInDatabase = false;
            } else {
                // Salt must not be modified for existing records
                $rowData['salt'] = $dbRecord['salt'];
            }
        }

        // New record w/o salt?
        if(!$rowExistsInDatabase) {
            $rowData['salt'] = uniqid();
        }

        // die(var_dump($rowData));
        // $log->info("pre-password-process row w/ data: " . print_r($rowData, true));

        // User is updating themselves.
        // Corresponds to a ping indicating their last activity.
        // Updated their "last_access" value.
        if(AuthProvider::loggedIn()) {
            $currentUser = AuthProvider::getUserInfo();
            if($rowData['id'] == $currentUser['id']) {
                $rowData['last_access'] = new Expression("NOW()");
            }
        }

        // $log->info("updating user row w/ data: " . print_r($rowData, true));

        return $rowData;
    }

}