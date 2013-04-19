<?php

namespace Directus\Db\RowGateway;

use Directus\Auth\Provider as AuthProvider;
use Directus\Bootstrap;
use Directus\Db\TableGateway\AclAwareTableGateway;
use Zend\Db\RowGateway\RowGateway;

class DirectusUsersRowGateway extends AclAwareRowGateway {

    public function preSaveDataHook(array $rowData, $rowExistsInDatabase = false)
    {
        // New record?
        // Attribute the currently authenticated user as the uploader
        if(!$rowExistsInDatabase) {
            $currentUser = AuthProvider::getUserInfo();
            $rowData['directus_user'] = $currentUser['id'];
        }

        // transitional:
        // - until we have backend form validation, strip out empty password fields
        if(isset($rowData['password']) && empty($rowData['password']))
            unset($rowData['password']);

        if(isset($rowData['id'])) {
            $logger = Bootstrap::get('log');
            $TableGateway = new AclAwareTableGateway($this->aclProvider, $this->table, $this->sql->getAdapter());
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

        // Hash password, if updating it
        if(isset($rowData['password']) && !empty($rowData['password'])) {
            $rowData['password'] = AuthProvider::hashPassword($rowData['password'], $rowData['salt']);
        }

        return $rowData;
    }

}