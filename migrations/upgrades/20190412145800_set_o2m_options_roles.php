<?php

use Phinx\Migration\AbstractMigration;

class SetO2MOptionsRoles extends AbstractMigration
{
    public function up()
    {
      $this->execute(\Directus\phinx_update(
          $this->getAdapter(),
          'directus_fields',
          ['options' => json_encode([
            'fields' => 'first_name,last_name'
          ])],
          ['collection' => 'directus_roles', 'field' => 'users']
      ));
    }
}
