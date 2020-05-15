<?php


use Phinx\Migration\AbstractMigration;

class UpdateNoteForDefaultLimit extends AbstractMigration
{
  public function up()
  {
    $this->execute(\Directus\phinx_update(
      $this->getAdapter(),
      'directus_fields',
      [
        'note' => 'The color that best fits your brand.'
      ],
      ['collection' => 'directus_settings', 'field' => 'color']
    ));

    $this->execute(\Directus\phinx_update(
      $this->getAdapter(),
      'directus_fields',
      [
        'note' => 'Default max amount of items that\'s returned at a time in the API.'
      ],
      ['collection' => 'directus_settings', 'field' => 'default_limit']
    ));

    $this->execute(\Directus\phinx_update(
      $this->getAdapter(),
      'directus_fields',
      [
        'width' => 'half',
      ],
      ['collection' => 'directus_settings', 'field' => 'password_policy']
    ));
  }
}
