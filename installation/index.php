<?php

session_start();

if(isset($_SESSION['step'])) {
  $step = $_SESSION['step'];
} else {
  $step = 0;
}

if(isset($_POST['backButton'])) {
  if($step > 0) {
    $_SESSION['step'] = $step - 1;
    $step--;
  }
}


if($step == 0 && isset($_POST['start'])) {
  $_SESSION['step'] = 1;
  $step = 1;
}

if($step == 1 && isset($_POST['email']) && isset($_POST['site_name']) && isset($_POST['password']) && isset($_POST['password_confirm'])) {
  if(!empty($_POST['email']) && !empty($_POST['site_name']) && !empty($_POST['password']) && !empty($_POST['directus_path'])) {
    if($_POST['password'] == $_POST['password_confirm'] && strlen($_POST['password']) > 0) {
      $_SESSION['email'] = $_POST['email'];
      $_SESSION['site_name'] = $_POST['site_name'];
      $_SESSION['password'] = $_POST['password'];
      $_SESSION['directus_path'] = $_POST['directus_path'];
      $_SESSION['step'] = 2;
      $step = 2;
    }
  }
}

if($step == 2 && isset($_POST['host_name']) && isset($_POST['username']) && isset($_POST['db_name'])) {
  //Check for db connection
  $connection = mysqli_connect($_POST['host_name'], $_POST['username'], $_POST['password'], $_POST['db_name']);
  if($connection) {
    $_SESSION['host_name'] = $_POST['host_name'];
    $_SESSION['username'] = $_POST['username'];
    $_SESSION['db_password'] = $_POST['password'];
    $_SESSION['db_name'] = $_POST['db_name'];
    $_SESSION['db_prefix'] = $_POST['db_prefix'];
    $_SESSION['install_sample'] = $_POST['install_sample'];
    $_SESSION['step'] = 3;
    $step = 3;
  } else {
    echo('<h1>ERROR: Connection Could not be made.</h1>');
  }
}

if($step == 4 && isset($_POST['install'])) {
  $_SESSION['step'] = 5;
  $step = 5;
}

if($step == 3 && isset($_POST['default_dest'])) {
  if(isset($_POST['default_url']) && isset($_POST['thumb_dest']) && isset($_POST['thumb_url']) && isset($_POST['temp_dest']) && isset($_POST['temp_url'])) {
    $_SESSION['default_dest'] = $_POST['default_dest'];
    $_SESSION['default_url'] = $_POST['default_url'];
    $_SESSION['thumb_dest'] = $_POST['thumb_dest'];
    $_SESSION['thumb_url'] = $_POST['thumb_url'];
    $_SESSION['temp_dest'] = $_POST['temp_dest'];
    $_SESSION['temp_url'] = $_POST['temp_url'];
    $_SESSION['step'] = 4;
    $step = 4;
  }
}
?><!doctype html>
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
</head>
<body>
  <form name="input" action="index.php" method="post">
    <!--
      <div>Default Adapter Destination</div>
      <input class="bad" value="">
    -->


<?php
if($step == 0) {
  ?>
  <div class="header">
    <div class="container">
      <img src="directus-logo.gif">
      <div>Install Directus</div>
    </div>
  </div>

  <div class="body">
    <div class="container intro">
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. In tristique, tellus faucibus sodales placerat, sem tellus laoreet sapien, vel adipiscing orci erat id libero.
      Aenean suscipit, lacus a faucibus interdum, ligula neque laoreet mi, quis elementum risus ante ac magna. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices
      posuere cubilia Curae; Ut sagittis risus in tincidunt commodo. Phasellus quis orci ut justo fringilla gravida nec eu tortor. Vestibulum ante ipsum primis in faucibus orci
      luctus et ultrices posuere cubilia Curae; Curabitur pharetra a orci ac mattis.
      <input type="hidden" name="start" value="true">
      <button type="submit" class="button primary">Get Started</button>
  <?php
}

if($step == 1) {
  ?>
  <div class="header">
    <div class="container">
      <img src="directus-logo.gif">
      <div>Project Info</div>
    </div>
  </div>

  <div class="body">
    <div class="container">
  <?php
  if (version_compare(PHP_VERSION, '5.5.0', '<')) {
    die('Your host needs to use PHP 5.5.0 or higher to run this version of Directus!');
  }

  if (!defined('PDO::ATTR_DRIVER_NAME')) {
    die('Your host needs to have PDO enabled to run this version of Directus!');
  }

  if (!extension_loaded('gd') || !function_exists('gd_info')) {
    die('Your host needs to have GD Library enabled to run this version of Directus!');
  }

  ?>
  Project Name<input type="text" name="site_name"><br>
  Project Path<input type="text" value="/directus/" name="directus_path"><br>
  Admin Email<input type="email" name="email"><br>
  Admin Password<input type="password" name="password"><br>
  Confirm Admin Password<input type="password" name="password_confirm"><br>

<?php
  if(extension_loaded('imagick')) {
    //echo '<span class="note">Imagick Already Installed</span>';
  } else {
    echo '<span class="note">*Install Imagick to support TIFF, PSD, and PDF thumbnails</span>';
  }
}

if($step == 2) {
?>
  <div class="header">
    <div class="container">
      <img src="directus-logo.gif">
      <div>Database Configuration</div>
    </div>
  </div>

  <div class="body">
    <div class="container">
        Host Name<input type="text" name="host_name"><br>
        Username<input type="text" name="username"><br>
        Password<input type="password" name="password"><br>
        Database Name<input type="text" name="db_name"><br>
        Database Prefix<input type="text" name="db_prefix"><br>
        Install Sample Data:<br>
      <input type="radio" name="install_sample" value="no">No<br>
      <input type="radio" name="install_sample" value="yes">Yes
<?php
}

if($step == 4) {
?>
  <div class="header">
    <div class="container">
      <img src="directus-logo.gif">
      <div>Confirmation</div>
    </div>
  </div>

  <div class="body">
    <div class="container">
      <br><br>
      Email This Configuration To <?php echo $_SESSION['email'];?>: <input type="checkbox" name="send_config_email"><br>

      <h3>Main Configuration</h3>
      <hr>
      <table>
        <tbody>
          <tr>
            <td class="item">Site Name</td>
            <td><?php echo $_SESSION['site_name'];?></td>
          </tr>
          <tr>
            <td class="item">Admin Email</td>
            <td><span><?php echo $_SESSION['email'];?></span>
            </td>
          </tr>
          <tr>
            <td class="item">Admin Password</td>
            <td>***</td>
          </tr>
        </tbody>
      </table>

      <h3>Database Configuration</h3>
      <hr>
      <table>
        <tbody>
          <tr>
            <td class="item">Host Name</td>
            <td><?php echo $_SESSION['host_name'];?></td>
          </tr>
          <tr>
            <td class="item">Username</td>
            <td><span><?php echo $_SESSION['username'];?></span></td>
          </tr>
          <tr>
            <td class="item">Password</td>
            <td>***</td>
          </tr>
          <tr>
            <td class="item">Database Name</td>
            <td><?php echo $_SESSION['db_name'];?></td>
          </tr>
          <tr>
            <td class="item">Database Prefix</td>
            <td><?php echo $_SESSION['db_prefix'];?></td>
          </tr>
        </tbody>
      </table>

      <h3>Pre-Installation Check</h3>
      <hr>
      <table>
        <tbody>
          <tr>
            <td class="item">PHP Version >= 5.5.0</td>
            <td><span class="label label-success">Yes</span></td>
          </tr>
          <tr>
            <td class="item">Database Support</td>
            <td><span class="label label-success">Yes</span></td>
          </tr>
          <tr>
            <td class="item">GD Support</td>
            <td><span class="label label-success">Yes</span></td>
          </tr>
          <tr>
            <td class="item">config.php Writable</td>
            <td><?php if(is_writable('../api/config.php')) {echo('<span class="label label-success">Yes</span>');}else{echo('<span class="label label-important">No</span> Please make ../api/config.php writable');}?></td>
          </tr>
          <tr>
            <td class="item">configuration.php Writable</td>
            <td><?php if(is_writable('../api/configuration.php')) {echo('<span class="label label-success">Yes</span>');}else{echo('<span class="label label-important">No</span> Please make ../api/configuration.php writable');}?></td>
          </tr>
          <tr>
            <td class="item">Logs Writable</td>
            <td><?php if(is_writable('../api/logs/1.txt')) {echo('<span class="label label-success">Yes</span>');}else{echo('<span class="label label-important">No</span> Please Make ../api/logs/ Writable');}?></td>
          </tr>
          <tr>
            <td class="item">mod_rewrite Enabled</td>
            <td><?php if(in_array('mod_rewrite', apache_get_modules())) {echo('<span class="label label-success">Yes</span>');}else{echo('<span class="label label-important">No</span> Please Make Enable mod_rewrite');}?></td>
          </tr>
        </tbody>
      </table>

      <h3>Reccommended Optional Features</h3>
      <hr>
      <table>
        <tbody>
          <tr>
            <td class="item">Imagick PHP Extension</td>
            <td><?php if(extension_loaded('imagick')) {echo('<span class="label label-success">Yes</span>');} else {echo('<span class="label label-important">No</span>');}?></td>
          </tr>
        </tbody>
      </table>

<?php
}

if($step == 3) {
  ?>
  <div class="header">
    <div class="container">
      <img src="directus-logo.gif">
      <div>Storage Adapter Setup</div>
    </div>
  </div>
  <div class="body">
    <div class="container">
        Default Adapter Destination<input type="text" name="default_dest" value="/var/www/media/" placeholder="/var/www/media/"><br>
        Default Adapter URL<input type="text" name="default_url" value="http://localhost/media/" placeholder="http://localhost/media/"><br>
        Thumbnail Adapter Destination<input type="text" name="thumb_dest" value="/var/www/media/thumb/" placeholder="/var/www/media/thumb/"><br>
        Thumbnail Adapter URL<input type="text" name="thumb_url" value="http://localhost/media/thumb/" placeholder="http://localhost/media/thumb/"><br>
        Temp Adapter Destination<input type="text" name="temp_dest" value="/var/www/media/temp/" placeholder="/var/www/media/temp/"><br>
        Temp Adapter URL<input type="text" name="temp_url" value="http://localhost/media/temp/" placeholder="http://localhost/media/temp/"><br>
<?php
}

if($step == 5) {
  require_once('query.php');
  CreateTables($create_statements,$mysqli);
  RunInserts($insert_statements, $mysqli);
  AddDefaultUser($_SESSION['email'], $_SESSION['password'], $mysqli);
  AddStorageAdapters($mysqli);
  $mysqli->close();

  echo"<h1>Database Updated</h1>";

  require_once('config_setup.php');
  WriteConfig();
  echo"<h1>Installation Done Updated</h1>";

  header('Location: ../');
}

?>
<script>var step = <?php echo($step); ?>;</script>
      </div>
    </div>

    <div class="footer">
      <div class="container">
        <button name="backButton" class="button left<?PHP if($step == 0){echo " hide";}?>">Back</button>
        <!--<div class="button right<?PHP if($step == 0){echo " hide";}?> primary disabled">Continue</div>-->
        <button type="submit" class="button right<?PHP if($step == 0){echo " hide";}?> primary disabled">Continue</button>

        <div class="breadcrumb">
          <span class="<?PHP if($step == 1){echo "current";} elseif($step > 1){echo "complete";}?>">Project Info</span>
          <span class="separator icon icon-chevron-right"></span>
          <span class="<?PHP if($step == 2){echo "current";} elseif($step > 2){echo "complete";}?>">Database</span>
          <span class="separator icon icon-chevron-right"></span>
          <span class="<?PHP if($step == 3){echo "current";} elseif($step > 3){echo "complete";}?>">Storage Adapters</span>
          <span class="separator icon icon-chevron-right"></span>
          <span class="<?PHP if($step == 4){echo "current";} elseif($step > 4){echo "complete";}?>">Confirmation</span>
        </div>
      </div>
    </div>
  </form>

  <script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js"></script>
  <script type="text/javascript" src="install.js"></script>
</body>
</html>