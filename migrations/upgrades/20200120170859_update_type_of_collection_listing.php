<?php

use Phinx\Migration\AbstractMigration;

class UpdateTypeOfCollectionListing extends AbstractMigration
{
    public function change()
    {
        $rolesTable = $this->table('directus_roles');

        // -------------------------------------------------------------------------
        // Update collection_listing column
        // -------------------------------------------------------------------------
        if ($rolesTable->hasColumn('collection_listing')) {
            $rolesTable->changeColumn('collection_listing', 'text', [
                'null' => true
            ])->update();
        }

        // -------------------------------------------------------------------------
        // Update module_listing column
        // -------------------------------------------------------------------------
        if ($rolesTable->hasColumn('module_listing')) {
            $rolesTable->changeColumn('module_listing', 'text', [
                'null' => true
            ])->update();
        }
    }
}
