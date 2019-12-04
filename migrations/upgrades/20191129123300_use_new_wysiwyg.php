<?php

use Phinx\Migration\AbstractMigration;

class UseNewWysiwyg extends AbstractMigration
{
  public function change() {
    // -------------------------------------------------------------------------
    // Change all uses of the wysiwyg_advanced interface to wysiwyg
    // -------------------------------------------------------------------------
    $this->execute(\Directus\phinx_update(
        $this->getAdapter(),
        'directus_fields',
        ['interface' => 'wysiwyg'],
        ['interface' => 'wysiwyg_advanced']
    ));
    $this->execute(\Directus\phinx_update(
        $this->getAdapter(),
        'directus_fields',
        ['interface' => 'wysiwyg'],
        ['interface' => 'wysiwyg_full']
    ));
  }
}
