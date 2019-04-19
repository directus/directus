<?php

use Phinx\Migration\AbstractMigration;

class CollectionNotes extends AbstractMigration
{
    public function up()
    {
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'note' => 'An internal description.'
            ],
            ['collection' => 'directus_collections', 'field' => 'note']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'note' => '[Learn More](https://docs.directus.io/guides/collections.html#managing-collections).'
            ],
            ['collection' => 'directus_collections', 'field' => 'managed']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'note' => '[Learn More](https://docs.directus.io/guides/collections.html#hidden).'
            ],
            ['collection' => 'directus_collections', 'field' => 'hidden']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'note' => '[Learn More](https://docs.directus.io/guides/collections.html#single).'
            ],
            ['collection' => 'directus_collections', 'field' => 'single']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'note' => 'The icon shown in the App\'s navigation sidebar.'
            ],
            ['collection' => 'directus_collections', 'field' => 'icon']
        ));

    }
}
