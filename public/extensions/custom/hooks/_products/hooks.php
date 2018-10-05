<?php

return [
    'filters' => [
        'collection.insert:before' => new \Directus\Custom\Hooks\Products\BeforeInsertProducts()
    ]
];
