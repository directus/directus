<?php

use Phinx\Migration\AbstractMigration;

class UseFileInterface extends AbstractMigration
{
    public function up()
    {
      $this->execute(\Directus\phinx_update(
          $this->getAdapter(),
          'directus_fields',
          ['interface' => 'file'],
          ['interface' => 'single-file']
      ));
    }
}
