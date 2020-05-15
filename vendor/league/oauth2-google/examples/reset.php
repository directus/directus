<?php

$provider = require __DIR__ . '/provider.php';

unset($_SESSION['token'], $_SESSION['state']);

header('Location: /');
