<?php

use Phinx\Migration\AbstractMigration;

class SetPasswordTypeToHash extends AbstractMigration
{
    public function up()
    {
      $this->execute(\Directus\phinx_update(
          $this->getAdapter(),
          'directus_fields',
          ['type' => \Directus\Database\Schema\DataTypes::TYPE_HASH],
          ['collection' => 'directus_users', 'field' => 'password']
      ));
    }
}
