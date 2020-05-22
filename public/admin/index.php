<?php

$assets = file_get_contents('./assets.json');
$assets = json_decode($assets, true);
$pathParts = explode('/', substr($_SERVER['REQUEST_URI'], 0, strrpos($_SERVER['REQUEST_URI'], '/') + 1));
$basePath = '';

foreach ($pathParts as $part) {
    $basePath .= $part . '/';

    if ($part === 'admin') {
        break;
    }
}

?>

<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta http-equiv=X-UA-Compatible content="IE=edge">
	<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
	<link rel="shortcut icon" href="<?= $basePath ?>favicon.ico">
	<link rel=manifest href="<?= $basePath ?>manifest.webmanifest">
	<title>Directus</title>
	<link href="<?= $basePath ?><?= $assets['chunk-vendors.css'] ?>" rel="stylesheet">
	<link href="<?= $basePath ?><?= $assets['app.css'] ?>" rel="stylesheet">
	<script>window.$directusAssetBasePath = "<?= $basePath ?>";</script>
	<script defer src="<?= $basePath ?><?= $assets['chunk-vendors.js'] ?>"></script>
	<script defer src="<?= $basePath ?><?= $assets['app.js'] ?>"></script>
</head>

<body class="auto">
	<noscript>
        <strong>We're sorry but Directus doesn't work without JavaScript enabled. Please enable it to
			continue.</strong>
    </noscript>
	<div id="app"></div>
</body>
</html>
