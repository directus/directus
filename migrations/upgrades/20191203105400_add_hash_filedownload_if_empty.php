<?php

use Phinx\Migration\AbstractMigration;
use function Directus\get_random_string;

class AddHashFiledownloadIfEmpty extends AbstractMigration
{
  public function change() {
    $filesTable = $this->table('directus_files');

    // -------------------------------------------------------------------------
    // Add a private hash for all existing files
    // -------------------------------------------------------------------------
    $filesWithoutPrivateHash = $this->fetchAll('SELECT id FROM directus_files WHERE private_hash IS NULL OR private_hash = "";');

    foreach($filesWithoutPrivateHash as $key => $value) {
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_files',
            ['private_hash' => get_random_string()],
            ['id' => $value['id']]
        ));
    }

    // -------------------------------------------------------------------------
    // Add a private hash for all existing files
    // -------------------------------------------------------------------------
    $filesWithoutFiledownload = $this->fetchAll('SELECT id, filename_disk FROM directus_files WHERE filename_download IS NULL OR filename_download = "";');

    foreach($filesWithoutFiledownload as $key => $value) {
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_files',
            ['filename_download' => $value['filename_disk']],
            ['id' => $value['id']]
        ));
    }

    // -------------------------------------------------------------------------
    // Save changes to table
    // -------------------------------------------------------------------------
    $filesTable->save();
  }
}
