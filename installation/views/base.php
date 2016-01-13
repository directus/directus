<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />

  <title>Install Directus</title>
  <meta name="description" content="Directus">
  <meta name="author" content="RANGER Studio LLC">

  <link rel='shortcut icon' type='image/x-icon' href='/favicon.ico' />
  <link href='http://fonts.googleapis.com/css?family=Open+Sans:300,400,600' rel='stylesheet' type='text/css'>
  <link rel="stylesheet" href="install.css?v=1.0">
  <style>.error{
      border: 1px solid red!important;;
    }</style>
</head>
<body>
    <header class="header">
        <div class="container">
          <img src="/installation/directus-logo.png">
          <div><?php echo $step['title']; ?></div>
        </div>
    </header>
    <div class="body">
        <?=$content; ?>
    </div>
    <footer class="footer">
        <div class="container">
            <button class="button right <?= ($current_step == 0) ? 'hide' : '' ?> primary disabled">Continue</button>
            <button id="backButton" name="backButton" class="button left <?= ($current_step == 0) ? 'hide' : '' ?>">Back</button>

            <div class="breadcrumb">
                <span class="<?= $current_step == 1 ? 'current' : '' ?>">Project Info</span>
                <span class="separator icon icon-chevron-right"></span>
                <span class="<?= $current_step == 2 ? 'current' : '' ?>">Database</span>
                <span class="separator icon icon-chevron-right"></span>
                <span class="<?= $current_step == 3 ? 'current' : '' ?>">Confirmation</span>
            </div>
        </div>
    </footer>

    <script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js"></script>
    <script type="text/javascript" src="install.js"></script>
    <script>
        var step = <?= $current_step; ?>;
        var directus_path = '<?= $root_path; ?>';
    </script>
</body>
</html>
