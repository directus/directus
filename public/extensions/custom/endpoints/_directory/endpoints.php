<?php

require __DIR__ . '/controllers/Home.php';

return [
    '' => [
        'method' => 'GET',
        'handler' => Home::class
    ],
];
