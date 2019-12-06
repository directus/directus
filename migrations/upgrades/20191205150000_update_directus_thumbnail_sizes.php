<?php

use Phinx\Migration\AbstractMigration;

class UpdateDirectusThumbnailSizes extends AbstractMigration
{
  public function change() {
    // -------------------------------------------------------------------------
    // Add Directus system thumbnail sizes
    // -------------------------------------------------------------------------
    $this->execute(\Directus\phinx_update(
        $this->getAdapter(),
        'directus_settings',
        ['value' => json_encode([
          [
            'key' => 'directus-small-crop',
            'width' => 64,
            'height' => 64,
            'fit' => 'crop',
            'quality' => 80
          ],
          [
            'key' => 'directus-small-contain',
            'width' => 64,
            'height' => 64,
            'fit' => 'contain',
            'quality' => 80
          ],
          [
            'key' => 'directus-medium-crop',
            'width' => 300,
            'height' => 300,
            'fit' => 'crop',
            'quality' => 80
          ],
          [
            'key' => 'directus-medium-contain',
            'width' => 300,
            'height' => 300,
            'fit' => 'contain',
            'quality' => 80
          ],
          [
            'key' => 'directus-large-crop',
            'width' => 800,
            'height' => 600,
            'fit' => 'crop',
            'quality' => 80
          ],
          [
            'key' => 'directus-large-contain',
            'width' => 800,
            'height' => 600,
            'fit' => 'contain',
            'quality' => 80
          ]
        ])],
        ['key' => 'asset_whitelist_system']
    ));
  }
}
