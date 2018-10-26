<?php

namespace Directus\Database\RowGateway;

class DirectusFilesRowGateway extends BaseRowGateway
{
    public function preSaveDataHook(array $rowData, $rowExistsInDatabase = false)
    {
        // New record?
        // Attribute the currently authenticated user as the uploader
        if (!$rowExistsInDatabase) {
            // $currentUser = AuthProvider::getUserInfo();
            // $cmsOwnerColumnName = $this->acl->getCmsOwnerColumnByTable($this->table);
            // $rowData[$cmsOwnerColumnName] = $currentUser['id'];
        } else {
            if (array_key_exists('date_uploaded', $rowData))
                unset($rowData['date_uploaded']);
        }
        return $rowData;
    }

}
