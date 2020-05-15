<?php

use Phinx\Migration\AbstractMigration;

class HideExternalId extends AbstractMigration
{
  public function change() {
    $this->execute(\Directus\phinx_update(
        $this->getAdapter(),
        'directus_fields',
        [
            'hidden_detail' => 1,
            'hidden_browse' => 1
        ],
        ['collection' => 'directus_users', 'field' => 'external_id']
    ));

  }
}
