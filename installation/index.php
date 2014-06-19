<?php

session_start();

if(isset($_SESSION['step'])) {
  $step = $_SESSION['step'];
} else {
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
    $_SESSION['step'] = 3;
    $step = 3;
  } else {
    echo('<h1>ERROR: Connection Could not be made.</h1>');
  }
}

if($step == 4 && isset($_POST['install_sample'])) {
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

if($step == 1) {
  echo'<h1>Requirements</h1>';
  if (version_compare(PHP_VERSION, '5.5.0', '<'))
  {
    die('Your host needs to use PHP 5.5.0 or higher to run this version of Directus!');
  } else {
    echo 'Correct PHP Version Installed<br><br>';
  }

  if (!defined('PDO::ATTR_DRIVER_NAME')) {
    die('Your host needs to have PDO enabled to run this version of Directus!');
  } else {
    echo 'PDO Installed! <br><br>';
  }

  if (!extension_loaded('gd') || !function_exists('gd_info')) {
    die('Your host needs to have GD Library enabled to run this version of Directus!');
  } else {
    echo 'GD LIbrary Installed! <br><br>';
  }

  echo'<h1>Optional</h1>';
  if(extension_loaded('imagick')) {
    echo 'Imagick Installed<br><br>';
  } else {
    echo 'Imagick Not Installed (No Tif/PSD/PDF thumbnail support)<br><br>';
  }
  ?>
  <form name="input" action="index.php" method="post">
  Site Name: <input type="text" name="site_name"><br>
  Site Path: <input type="text" value="/directus/" name="directus_path"><br>
  Email: <input type="email" name="email"><br>
  Password: <input type="password" name="password"><br>
  Password Confirm: <input type="password" name="password_confirm"><br>
  <input type="submit" value="Submit">
  </form>
<?php
}

if($step == 2) {
  echo'<h1>Database Configuration</h1>';
?>

<form name="input" action="index.php" method="post">
  Host Name: <input type="text" name="host_name"><br>
  username: <input type="text" name="username"><br>
  Password: <input type="password" name="password"><br>
  Database Name: <input type="text" name="db_name"><br>
  DB Prefix: <input type="text" name="db_prefix"><br>
  <input type="submit" value="Submit">
</form>

<?php
}

if($step == 4) {
?>

<form name="input" action="index.php" method="post">
  Install Sample Data:<br>
  <input type="radio" name="install_sample" value="no">No<br>
  <input type="radio" name="install_sample" value="yes">Yes
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
  <input type="submit" value="Install">
</form>

<?php
}

if($step == 3) {

  ?>
<h1>Storage Adapter Setup</h1>

<form name="input" action="index.php" method="post">
  Default Adapter Destination: <input type="text" name="default_dest" value="/var/www/media/"><br>
  Default Adapter URL: <input type="text" name="default_url" value="http://localhost/media/"><br>
  Thumbnail Adapter Destination: <input type="text" name="thumb_dest" value="/var/www/media/thumb/"><br>
  Thumbnail Adapter URL: <input type="text" name="thumb_url" value="http://localhost/media/thumb/"><br>
  Temp Adapter Destination: <input type="text" name="temp_dest" value="/var/www/media/temp/"><br>
  Temp Adapter URL: <input type="text" name="temp_url" value="http://localhost/media/temp/"><br>
  <input type="submit" value="Submit">
</form>

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














