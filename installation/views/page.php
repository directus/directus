<html>
<head>
	<meta charset="utf-8">
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>

	<title>Install Directus</title>
	<meta name="description" content="Directus">
	<meta name="author" content="RANGER Studio LLC">

	<link rel='shortcut icon' type='image/x-icon' href='/favicon.ico'/>
	<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:400,400italic,700" type="text/css">
	<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
	<link rel="stylesheet" href="<?=$path;?>installation/assets/install.css?v=<?=$now;?>">
    <style>
        pre {
            font-size: 1rem;
            font-weight: bold;
            color: #444444;
        }
    </style>
</head>
<body>
    <div class="modal">
        <div class="header">
            <a href="https://getdirectus.com" target="_blank">
                <img src="<?=$path;?>installation/assets/directus-logo.svg">
            </a>

            <a href="https://docs.getdirectus.com" target="_blank" class="help-button">
                <i class="material-icons">help</i> Help
            </a>
        </div>
        <div class="errors">
            <p><?=$message;?></p>
        </div>
        <div>
            <h3><i>Try installing the composer dependencies</i></h3>
            <pre>$ composer install</pre>
        </div>
    </div>
</body>
</html>
