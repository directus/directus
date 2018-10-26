<?php

return [
    'filters' => [
        'item.create:before' => new \Directus\Custom\Hooks\Products\BeforeInsertProducts()
    ]
];
