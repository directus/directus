<?php

use Phinx\Migration\AbstractMigration;

class RenameToggle extends AbstractMigration
{
    public function change()
    {
        // Replace toggle interfaces with switch
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            ['interface' => 'switch'],
            ['interface' => 'toggle']
        ));
    }
}
