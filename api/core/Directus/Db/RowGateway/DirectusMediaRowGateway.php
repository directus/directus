<?php

namespace Directus\Db\RowGateway;

use Directus\Auth\Provider as AuthProvider;
use Directus\Bootstrap;
use Zend\Db\RowGateway\RowGateway;

class DirectusMediaRowGateway extends AclAwareRowGateway {

    public function preSaveDataHook(array $rowData, $rowExistsInDatabase = false)
    {
        // New record?
        // Attribute the currently authenticated user as the uploader
        if(!$rowExistsInDatabase) {
            $currentUser = AuthProvider::getUserInfo();
            $cmsOwnerColumnName = $this->aclProvider->getCmsOwnerColumnByTable($this->table);
            $rowData[$cmsOwnerColumnName] = $currentUser['id'];
        }
        return $rowData;
    }

}