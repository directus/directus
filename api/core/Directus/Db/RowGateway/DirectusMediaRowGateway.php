<?php

namespace Directus\Db\RowGateway;

use Zend\Db\RowGateway\RowGateway;

use Directus\Auth\Provider as AuthProvider;
use Directus\Bootstrap;

class DirectusMediaRowGateway extends AclAwareRowGateway {

    /**
     * Populate Data
     *
     * @param  array $rowData
     * @param  bool  $rowExistsInDatabase
     * @return AbstractRowGateway
     */
    public function populate(array $rowData, $rowExistsInDatabase = false)
    {
        $this->logger()->info(__CLASS__."#".__FUNCTION__);
        $this->logger()->info("pre-process");
        $this->logger()->info(print_r($rowData, true));
        // New record?
        // Attribute the currently authenticated user as the uploader
        if(!$rowExistsInDatabase) {
            $this->logger()->info("apparently row doesn't exist in database");
            $currentUser = AuthProvider::getUserInfo();
            $rowData['user'] = $currentUser['id'];
        }
        else $this->logger()->info("\"rowExistsInDatabase\"");
        $this->logger()->info("post-process");
        $this->logger()->info(print_r($rowData, true));
        return parent::populate($rowData, $rowExistsInDatabase);
    }

}