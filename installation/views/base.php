<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />

    <title>Install Directus</title>
    <meta name="description" content="Directus">
    <meta name="author" content="RANGER Studio LLC">

    <link rel='shortcut icon' type='image/x-icon' href='/favicon.ico' />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,300italic,400italic,500italic" type="text/css">
    <link rel="stylesheet" href="<?=$root_path;?>installation/assets/install.css?v=<?=date('Ymd', time());?>">
</head>
<body>
    <div class="header">
        <img src="<?=$root_path;?>installation/assets/directus-logo.png">
        <h1><?=$step->getTitle();?></h1>
        <div class="breadcrumb">
            <?php foreach($steps as $index => $aStep): ?>
            <?php if ($index > 0): ?>
            <span class="separator">●</span>
            <?php endif; ?>
            <span class="<?=($step->getName() === $aStep->getName())?'current':'';?>"><?=($index);?>. <?=$aStep->getShortTitle();;?></span>
            <?php endforeach; ?>
        </div>
    </div>
    <div class="container">
        <form method="post" action="<?=$root_path;?>installation/index.php?step=<?= $current_step; ?>">
            <?= $content; ?>
            <button type="submit" class="button primary disabled">Continue</button>
            <a href="<?=$root_path;?>installation/index.php?step=<?= $current_step-1; ?>" class="no-button<?=($current_step > 1)?'':' hide'?>">Go Back</a>
        </form>
    </div>
    <script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js"></script>
    <script type="text/javascript" src="<?=$root_path;?>installation/assets/install.js"></script>
    <script>
        var step = <?= $current_step; ?>;
        var directus_path = '<?= $root_path; ?>';
    </script>
</body>
</html>
