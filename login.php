<?php

//If config file doesnt exist, go to install file
if(!file_exists('api/config.php') || filesize('api/config.php') == 0) {
  header('Location: installation/index.php');
}

// Composer Autoloader
$loader = require 'api/vendor/autoload.php';
$loader->add("Directus", dirname(__FILE__) . "/api/core/");

require "api/config.php";
require "api/globals.php";

/**
 * Temporary solution for disabling this page for logged in users.
 */

if(\Directus\Auth\Provider::loggedIn()) {
    header('Location: ' . DIRECTUS_PATH );
    exit;
}

// Get current commit hash
$git = __DIR__ . '/.git';
$cacheBuster = Directus\Util\Git::getCloneHash($git);

?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
  <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no,maximum-scale=1.0">
  <title>Directus Login</title>

  <!-- Icons -->
  <link rel="apple-touch-icon" sizes="57x57" href="<?= DIRECTUS_PATH ?>assets/img/icons/apple-icon-57x57.png">
  <link rel="apple-touch-icon" sizes="60x60" href="<?= DIRECTUS_PATH ?>assets/img/icons/apple-icon-60x60.png">
  <link rel="apple-touch-icon" sizes="72x72" href="<?= DIRECTUS_PATH ?>assets/img/icons/apple-icon-72x72.png">
  <link rel="apple-touch-icon" sizes="76x76" href="<?= DIRECTUS_PATH ?>assets/img/icons/apple-icon-76x76.png">
  <link rel="apple-touch-icon" sizes="114x114" href="<?= DIRECTUS_PATH ?>assets/img/icons/apple-icon-114x114.png">
  <link rel="apple-touch-icon" sizes="120x120" href="<?= DIRECTUS_PATH ?>assets/img/icons/apple-icon-120x120.png">
  <link rel="apple-touch-icon" sizes="144x144" href="<?= DIRECTUS_PATH ?>assets/img/icons/apple-icon-144x144.png">
  <link rel="apple-touch-icon" sizes="152x152" href="<?= DIRECTUS_PATH ?>assets/img/icons/apple-icon-152x152.png">
  <link rel="apple-touch-icon" sizes="180x180" href="<?= DIRECTUS_PATH ?>assets/img/icons/apple-icon-180x180.png">
  <link rel="icon" type="image/png" sizes="192x192"  href="<?= DIRECTUS_PATH ?>assets/img/icons/android-icon-192x192.png">
  <link rel="icon" type="image/png" sizes="32x32" href="<?= DIRECTUS_PATH ?>assets/img/icons/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="96x96" href="<?= DIRECTUS_PATH ?>assets/img/icons/favicon-96x96.png">
  <link rel="icon" type="image/png" sizes="16x16" href="<?= DIRECTUS_PATH ?>assets/img/icons/favicon-16x16.png">
  <link rel="manifest" href="<?= DIRECTUS_PATH ?>assets/img/icons/manifest.json">
  <meta name="msapplication-TileColor" content="#ffffff">
  <meta name="msapplication-TileImage" content="/ms-icon-144x144.png">
  <meta name="theme-color" content="#ffffff">

  <link href='//fonts.googleapis.com/css?family=Open+Sans:300italic,400italic,600italic,700italic,800italic,400,300,600,700,800' rel='stylesheet' type='text/css'>
  <link rel="stylesheet" href="assets/css/directus.min.css">
  <style>
    html,body {
      margin:0;
      padding:0;
      height: 100%;
      width: 100%;
    }
  </style>
</head>

<body class="font-primary">

<!-- Main container. -->
<form action="<?= DIRECTUS_PATH ?>api/1/auth/login" method="post" class="login-box" autocomplete="off">
  <div class='login-panel'>
    <p class="">
    <input type="text" name="email" placeholder="Email Address" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off" />
    </p>
    <p class="">
      <input type="password" name="password" placeholder="Password" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off" />
      <span id="forgot-password" title="Forgot Password" class="btn btn-primary"></span>
    </p>
    <p class="clearfix no-margin">
      <button type="submit" class="btn primary">Sign in</button>
    </p>
    <!--<label class="checkbox">
        <input type="checkbox" name="remember" /> Keep me logged in on this computer
    </label>-->
  </div>
  <p class="error" style="display:none;"></p>
  <p class="message" style="display:none;"></p>
  <div class="directus-version" title="<?php echo $cacheBuster; ?>">Version: <?php echo(DIRECTUS_VERSION) ?></div>
  <!-- <button type="submit" class="btn btn-primary">Sign in</button> -->
  <!-- <button id="forgot-password" class="btn btn-primary">Forgot Password</button> -->
</form>

<!-- Javascripts -->
<script type="text/javascript" src="<?= DIRECTUS_PATH ?>assets/js/libs/jquery.js"></script>
<script type="text/javascript">
$(function(){

  var $login_message = $('p.message');
  var $login_error = $('p.error');

  function message(message, error) {
    error = error || false;
    if(error) {
      $login_error.html(message);
      $login_error.show();
    } else {
      $login_message.html(message);
      $login_message.show();
    }
  }

  <?php if(isset($_GET['inactive'])) {echo 'message("Logged out due to inactivity", true);';}?>

  function clear_messages() {
    $login_error.hide();
    $login_message.hide();
  }

  $('#forgot-password').bind('click', function(e){
    e.preventDefault();
    clear_messages();
    var $form = $(this).closest('form'),
        email = $.trim($form.find('input[name=email]').val());
    if(email.length == 0) {
      message("Please enter a valid email address", true);
      return false;
    }
    if(confirm('Are you sure you want to reset your password?')) {
      $.ajax('<?= DIRECTUS_PATH . 'api/' . API_VERSION . '/auth/forgot-password' ?>', {
        data: { email: email },
        dataType: 'json',
        type: 'POST',
        success: function(data, textStatus, jqXHR) {
          if(!data.success) {
            var errorMessage = "Oops an error occurred!";
            if(data.message) {
                errorMessage = data.message;
            }
            message(errorMessage, true);
            return;
          }
          message("Temporary password sent to your email address")
        },
        error: function(jqXHR, textStatus, errorThrown) {
          message("Server error occurred!", true);
        }
      });
    }
  });

  $('form').bind('submit', function(e){
    e.preventDefault();
    clear_messages();
    var email = $.trim($(this).find('input[name=email]').val()),
        password = $.trim($(this).find('input[name=password]').val());

    if(email.length == 0 || password.length == 0) {
      return message("Please enter your email and password", true);
    }

    $.ajax('<?= DIRECTUS_PATH . 'api/' . API_VERSION . '/auth/login' ?>', {
      data: { email: email, password: password },
      dataType: 'json',
      type: 'POST',
      success: function(data, textStatus, jqXHR) {

        // Default path
        var defaultPath = 'users';
        <?php
        $redirectPath = '';
          if (isset($_SESSION['_directus_login_redirect'])) {
            $redirectPath = $_SESSION['_directus_login_redirect'];
        }
        ?>
        var redirectPath = '<?php echo trim($redirectPath, '/'); ?>';
        var lastPage = data.last_page;
        var lastPagePath = lastPage ? lastPage.path : '';

        path = redirectPath || lastPagePath || defaultPath;

        if(!data.success) {
          message(data.message, true);
          return;
        }

        window.location = "<?= DIRECTUS_PATH ?>"+path;

      },
      error: function(jqXHR, textStatus, errorThrown) {
        message("Server error occurred!", true);
      }
    });
  });

});
</script>
</body>
</html>
