<?php

use Phinx\Migration\AbstractMigration;

class UseCorrectWysiwyg extends AbstractMigration
{
  public function change() {
    // -------------------------------------------------------------------------
    // Change all uses of the old wysiwyg interfaces to the new one
    // -------------------------------------------------------------------------
    $this->execute(\Directus\phinx_update(
        $this->getAdapter(),
        'directus_fields',
        ['interface' => 'wysiwyg'],
        ['interface' => 'wysiwyg-advanced']
    ));
    $this->execute(\Directus\phinx_update(
        $this->getAdapter(),
        'directus_fields',
        ['interface' => 'wysiwyg'],
        ['interface' => 'wysiwyg-full']
    ));
  }
}
