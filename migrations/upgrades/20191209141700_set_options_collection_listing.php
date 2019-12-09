<?php

use Phinx\Migration\AbstractMigration;

class SetOptionsCollectionListing extends AbstractMigration
{
  public function change() {
    // -------------------------------------------------------------------------
    // Use the correct options for collection listing
    // -------------------------------------------------------------------------
    $this->execute(\Directus\phinx_update(
        $this->getAdapter(),
        'directus_fields',
        [
            'options' => '{"template":"{{ name }}","createItemText":"Add Module","fields":[{"field":"name","interface":"text-input","type":"string","width":"half"},{"field":"link","interface":"text-input","type":"string","width":"half"},{"field":"icon","interface":"icon","type":"string","width":"full"}]}'
        ],
        ['collection' => 'directus_roles', 'field' => 'module_listing']
    ));

    $this->execute(\Directus\phinx_update(
        $this->getAdapter(),
        'directus_fields',
        [
            'options' => '{"template":"{{ group_name }}","createItemText":"Add Group","fields":[{"field":"group_name","width":"full","interface":"text-input","type":"string"},{"field":"collections","interface":"repeater","type":"JSON","options":{"createItemText":"Add Collection","fields":[{"field":"collection","type":"string","interface":"collections","width":"full"}]}}]}'
        ],
        ['collection' => 'directus_roles', 'field' => 'collection_listing']
    ));
  }
}
