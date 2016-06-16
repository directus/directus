<?php

namespace Directus\Db\RowGateway;

use Directus\Auth\Provider as AuthProvider;
use Directus\Bootstrap;
use Zend\Db\RowGateway\RowGateway;

class DirectusFilesRowGateway extends AclAwareRowGateway {

    public function preSaveDataHook(array $rowData, $rowExistsInDatabase = false)
    {
        // New record?
        // Attribute the currently authenticated user as the uploader
        if(!$rowExistsInDatabase) {
            $currentUser = AuthProvider::getUserInfo();
            $cmsOwnerColumnName = $this->acl->getCmsOwnerColumnByTable($this->table);
            $rowData[$cmsOwnerColumnName] = $currentUser['id'];
        } else {
            if(array_key_exists('date_uploaded', $rowData))
                unset($rowData['date_uploaded']);
        }
        return $rowData;
    }

}