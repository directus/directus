<?php

use Phinx\Migration\AbstractMigration;

class UpdateUserCreatedInterface extends AbstractMigration
{

    public function change()
    {
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            ['interface' => 'owner'],
            ['interface' => 'user-created']
        ));
    }
}
