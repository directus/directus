<?php

use Phinx\Migration\AbstractMigration;

class UpdateSlugOptionForAssetWhiteList extends AbstractMigration
{
    public function change()
    {
        // -------------------------------------------------------------------------
        // Update Slug Option For Field Key In Asset WhiteList
        // -------------------------------------------------------------------------
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'options' => json_encode([
                    'template' => '{{key}}',
                    'fields' => [
                        [
                            'field' => 'key',
                            'interface' => 'slug',
                            'width' => 'half',
                            'type' => 'string',
                            'required' => true,
                            'options' => [
                                'onlyOnCreate' => false
                            ]
                        ],
                        [
                            'field' => 'fit',
                            'interface' => 'dropdown',
                            'width' => 'half',
                            'type' => 'string',
                            'options' => [
                                'choices' => [
                                    'crop' => 'Crop (forces exact size)',
                                    'contain' => 'Contain (preserve aspect ratio)'
                                ]
                            ],
                            'required' => true
                        ],
                        [
                            'field' => 'width',
                            'interface' => 'numeric',
                            'width' => 'half',
                            'type' => 'integer',
                            'required' => true
                        ],
                        [
                            'field' => 'height',
                            'interface' => 'numeric',
                            'width' => 'half',
                            'type' => 'integer',
                            'required' => true
                        ],
                        [
                            'field' => 'quality',
                            'interface' => 'slider',
                            'width' => 'full',
                            'type' => 'integer',
                            'default' => 80,
                            'options' => [
                                'min' => 0,
                                'max' => 100,
                                'step' => 1
                            ],
                            'required' => true
                        ]
                    ]
                ])
            ],
            ['collection' => 'directus_settings', 'field' => 'asset_whitelist']
        ));
    }
}


