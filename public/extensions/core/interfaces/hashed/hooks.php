<?php

use Directus\Hook\Payload;
use Directus\Application\Application;

$hashValue = function (Payload $payload) {
    $data = $payload->getData();
    $container = Application::getInstance()->getContainer();
    $schemaManager = $container->get('schema_manager');
    $hashManager = $container->get('hash_manager');

    $collection = $schemaManager->getCollection($payload->attribute('collection_name'));
    $interfaceName = basename(__DIR__);

    foreach ($data as $fieldName => $value) {
        $field = $collection->getField($fieldName);
        if ($field && $field->getInterface() === $interfaceName) {
            $options = $field->getOptions() ?: ['hasher' => 'core'];

            $hashedString = $hashManager->hash($value, $options);
            $payload->set($fieldName, $hashedString);
        }
    }

    return $payload;
};

return [
    'filters' => [
        'item.create:before' => $hashValue,
        'item.update:before' => $hashValue,
    ]
];
