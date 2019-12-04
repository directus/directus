<?php

use Phinx\Migration\AbstractMigration;

class MiscRequiredFields extends AbstractMigration
{
    public function up()
    {
      $this->execute(\Directus\phinx_update(
          $this->getAdapter(),
          'directus_fields',
          [
            'required' => 1
          ],
          ['collection' => 'directus_users', 'field' => 'status']
      ));

      $this->execute(\Directus\phinx_update(
          $this->getAdapter(),
          'directus_fields',
          [
            'required' => 1
          ],
          ['collection' => 'directus_users', 'field' => 'timezone']
      ));

      $this->execute(\Directus\phinx_update(
          $this->getAdapter(),
          'directus_fields',
          [
            'required' => 1
          ],
          ['collection' => 'directus_users', 'field' => 'locale']
      ));

      $this->execute(\Directus\phinx_update(
          $this->getAdapter(),
          'directus_fields',
          [
            'required' => 1
          ],
          ['collection' => 'directus_users', 'field' => 'roles']
      ));

      $this->execute(\Directus\phinx_update(
          $this->getAdapter(),
          'directus_fields',
          [
            'required' => 1
          ],
          ['collection' => 'directus_roles', 'field' => 'name']
      ));

      $this->execute(\Directus\phinx_update(
          $this->getAdapter(),
          'directus_fields',
          [
            'required' => 1
          ],
          ['collection' => 'directus_files', 'field' => 'filename']
      ));

      $this->execute(\Directus\phinx_update(
          $this->getAdapter(),
          'directus_fields',
          [
            'sort' => 10
          ],
          ['collection' => 'directus_files', 'field' => 'width']
      ));

      $this->execute(\Directus\phinx_update(
          $this->getAdapter(),
          'directus_fields',
          [
            'sort' => 11
          ],
          ['collection' => 'directus_files', 'field' => 'height']
      ));

      $this->execute(\Directus\phinx_update(
          $this->getAdapter(),
          'directus_fields',
          [
            'sort' => 12
          ],
          ['collection' => 'directus_files', 'field' => 'duration']
      ));

      $this->execute(\Directus\phinx_update(
          $this->getAdapter(),
          'directus_fields',
          [
            'sort' => 13
          ],
          ['collection' => 'directus_files', 'field' => 'filesize']
      ));

      $this->execute(\Directus\phinx_update(
          $this->getAdapter(),
          'directus_fields',
          [
            'sort' => 8
          ],
          ['collection' => 'directus_files', 'field' => 'uploaded_on']
      ));

      $this->execute(\Directus\phinx_update(
          $this->getAdapter(),
          'directus_fields',
          [
            'sort' => 9
          ],
          ['collection' => 'directus_files', 'field' => 'uploaded_by']
      ));

      $this->execute(\Directus\phinx_update(
          $this->getAdapter(),
          'directus_fields',
          [
            'hidden_browse' => 1
          ],
          ['collection' => 'directus_files', 'field' => 'checksum']
      ));
    }
}
