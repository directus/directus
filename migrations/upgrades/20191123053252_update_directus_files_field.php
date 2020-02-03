<?php


use Phinx\Migration\AbstractMigration;

class UpdateDirectusFilesField extends AbstractMigration
{
    /**
     * Version : v8.0.0
     * Update the fields of directus_files table
     */
    public function change()
    {
        $filesTable = $this->table('directus_files');
        $fieldsTable = $this->table('directus_fields');

        if(!$this->checkFieldExist('directus_files', 'checksum')){
            $fieldsTable->insert([
                'collection' => 'directus_files',
                'field' => 'checksum',
                'type' => 'string',
                'interface' => 'text-input',
            ])->save();
        }
        if (!$filesTable->hasColumn('checksum')) {
            $filesTable->addColumn('checksum', 'string', [
                'limit' => 32,
                'null' => true,
                'default' => null,
                'hidden_browse' => 1
            ])->save();
        }

        if($this->checkFieldExist('directus_files', 'filename')){
            $this->execute(\Directus\phinx_update(
                $this->getAdapter(),
                'directus_fields',
                [
                  'required' => 1
                ],
                ['collection' => 'directus_files', 'field' => 'filename']
            ));
        }

        if($this->checkFieldExist('directus_files', 'width')){
            $this->execute(\Directus\phinx_update(
                $this->getAdapter(),
                'directus_fields',
                [
                  'sort' => 10
                ],
                ['collection' => 'directus_files', 'field' => 'width']
            ));
        }

        if($this->checkFieldExist('directus_files', 'height')){
            $this->execute(\Directus\phinx_update(
                $this->getAdapter(),
                'directus_fields',
                [
                  'sort' => 11
                ],
                ['collection' => 'directus_files', 'field' => 'height']
            ));
        }

        if($this->checkFieldExist('directus_files', 'duration')){
            $this->execute(\Directus\phinx_update(
                $this->getAdapter(),
                'directus_fields',
                [
                    'readonly' => 1,
                    'note' => 'Duration must be in seconds',
                    'sort' => 12
                ],
                ['collection' => 'directus_files', 'field' => 'duration']
            ));
        }

        if($this->checkFieldExist('directus_files', 'filesize')){
            $this->execute(\Directus\phinx_update(
                $this->getAdapter(),
                'directus_fields',
                [
                  'sort' => 13
                ],
                ['collection' => 'directus_files', 'field' => 'filesize']
            ));
        }

        if($this->checkFieldExist('directus_files', 'uploaded_on')){
            $this->execute(\Directus\phinx_update(
                $this->getAdapter(),
                'directus_fields',
                [
                  'sort' => 8
                ],
                ['collection' => 'directus_files', 'field' => 'uploaded_on']
            ));

        }

        if($this->checkFieldExist('directus_files', 'code')){
            $this->execute(\Directus\phinx_update(
                $this->getAdapter(),
                'directus_fields',
                [
                  'interface' => 'json'
                ],
                ['collection' => 'directus_files', 'interface' => 'code']
            ));
        }

        if($this->checkFieldExist('directus_files', 'uploaded_by')){
            $this->execute(\Directus\phinx_update(
                $this->getAdapter(),
                'directus_fields',
                [
                    'type' => \Directus\Database\Schema\DataTypes::TYPE_OWNER,
                    'interface' => 'user-created',
                    'sort' => 9
                ],
                ['collection' => 'directus_files', 'field' => 'uploaded_by']
            ));
        }

        if($this->checkFieldExist('directus_files', 'tags')){
            $this->execute(\Directus\phinx_update(
                $this->getAdapter(),
                'directus_fields',
                [
                    'options' => json_encode([
                        'placeholder' => 'Enter a keyword then hit enter...'
                    ]),
                ],
                ['collection' => 'directus_files', 'field' => 'tags']
            ));
        }

        if($this->checkFieldExist('directus_files', 'description')){
            $this->execute(\Directus\phinx_update(
                $this->getAdapter(),
                'directus_fields',
                [
                    'options' => json_encode([
                        'toolbar' => ['bold','italic','underline','link','code']
                    ]),
                ],
                ['collection' => 'directus_files', 'field' => 'description']
            ));
        }

        if($this->checkFieldExist('directus_files', 'metadata')){
            $this->execute(\Directus\phinx_update(
                $this->getAdapter(),
                'directus_fields',
                [
                    'width' => 'full'
                ],
                ['collection' => 'directus_files', 'field' => 'metadata']
            ));
        }

        if (!$filesTable->hasColumn('private_hash')) {
            $filesTable->addColumn('private_hash', 'string', [
                'limit' => 16,
                'null' => true,
                'default' => null
            ])->save();
        }

        if(!$this->checkFieldExist('directus_files', 'private_hash')){
            $fieldsTable->insert([
                'collection' => 'directus_files',
                'field' => 'private_hash',
                'type' => 'string',
                'interface'=>'text-input',
                'readonly' => 1,
                'hidden_browse' => 1,
                'hidden_detail' => 1
            ])->save();
        }
    }

    public function checkFieldExist($collection,$field){
        $checkSql = sprintf('SELECT 1 FROM `directus_fields` WHERE `collection` = "%s" AND `field` = "%s";', $collection, $field);
        return $this->query($checkSql)->fetch();
    }
}
