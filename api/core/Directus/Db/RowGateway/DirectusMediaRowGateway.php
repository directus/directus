<?php

namespace Directus\Db\RowGateway;

use Zend\Db\RowGateway\RowGateway;

use Directus\Auth\Provider as AuthProvider;
use Directus\Bootstrap;

class DirectusMediaRowGateway extends AclAwareRowGateway {

    public function preSaveDataHook(array $rowData, $rowExistsInDatabase = false)
    {
        // New record?
        // Attribute the currently authenticated user as the uploader
        if(!$rowExistsInDatabase) {
            $currentUser = AuthProvider::getUserInfo();
            $rowData['user'] = $currentUser['id'];
        }
        return $rowData;
    }

}