<?php

require "api/config.php";

/**
 * Temporary solution for disabling this page for logged in users.
 */

// Composer Autoloader
$loader = require 'api/vendor/autoload.php';
$loader->add("Directus", dirname(__FILE__) . "/api/core/");

if(\Directus\Auth\Provider::loggedIn()) {
    header('Location: ' . DIRECTUS_PATH );
    exit;
}

?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
  <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no,maximum-scale=1.0">
  <title>directus</title>
  <!-- Application styles. -->
  <link rel="shortcut icon" href="favicon.ico">
  <link href='http://fonts.googleapis.com/css?family=Open+Sans:300italic,400italic,600italic,700italic,800italic,400,300,600,700,800' rel='stylesheet' type='text/css'>
  <link rel="stylesheet" href="assets/css/index.css">
  <style>
    body {background-image: url(assets/img/noise.gif); margin:0; padding:0;}
    /* .login-panel { background-color:rgba(255,255,255,0.4); padding:20px; width:372px; box-shadow: 0px 1px 10px 0px rgba(0,0,0,0.05); position: absolute; left:50%; top:50%; margin-left:-208px; margin-top:-245px;} */
    /* .login-panel p.error { padding: 15px 10px 0; margin: 0; color: red; } */
    /* .login-panel p.message { padding: 15px 10px 0; margin: 0; color: green; } */
    /*
input[type="text"], input[type="password"] {font-size:16px; width:360px; border:0;  margin-bottom:20px; height:30px; line-height:30px;} 
    input[type="submit"], button { display:block; width:375px; }
*/
    /* label {margin-bottom:20px; font-weight:normal;} */
    /* h2 {font-size:26px; margin-bottom:20px; margin-top:0px;} */
  </style>
</head>

<body class="font-primary">

<!-- Main container. -->
<form action="<?= DIRECTUS_PATH ?>api/1/auth/login" method="post" class="login-box">
  <div class='login-panel'>
    <p class="">
    <input type="text" name="email" placeholder="Email Address" />
    </p>
    <p class="">
      <input type="password" name="password" placeholder="Password" />
      <button id="forgot-password" class="btn btn-primary"></button>
    </p>
    <!--<label class="checkbox">
        <input type="checkbox" name="remember" /> Keep me logged in on this computer
    </label>-->
    
    <p class="error" style="display:none;"></p>
    <p class="message" style="display:none;"></p>
  </div>
  <button type="submit" class="btn btn-primary">Sign in</button>
  <!-- <button id="forgot-password" class="btn btn-primary">Forgot Password</button> -->
</form>

<div class="left-corner-message">
  <span class="icon icon-circled-info"></span>
  logged out due to inactivity
</div>
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

  function clear_messages() {
    $login_error.hide();
    $login_message.hide();
  }

  $('button#forgot-password').bind('click', function(e){
    e.preventDefault();
    clear_messages();
    var $form = $(this).closest('form'),
        email = $.trim($form.find('input[name=email]').val());
    if(email.length == 0) {
      message("Please enter a valid email address.", true);
      return false;
    }
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
        message("We sent a temporary password to your email address.")
      },
      error: function(jqXHR, textStatus, errorThrown) {
        message("Server error occurred. (" + textStatus + ")", true);
      }
    });
  });

  $('form').bind('submit', function(e){
    e.preventDefault();
    clear_messages();
    var email = $.trim($(this).find('input[name=email]').val()), 
        password = $.trim($(this).find('input[name=password]').val());

    if(email.length == 0 || password.length == 0) {
      return message("We need both!", true);
    }

    $.ajax('<?= DIRECTUS_PATH . 'api/' . API_VERSION . '/auth/login' ?>', {
      data: { email: email, password: password },
      dataType: 'json',
      type: 'POST',
      success: function(data, textStatus, jqXHR) {

        // Default path
        var path = 'users';

        // Silent error if the path is not avalible
        try {
          var lastPage = JSON.parse(data.last_page);
          path = lastPage.path;
        } catch(e) {
          console.warn('Parsing path object failed', data.last_page);
        }

        if(!data.success) {
          message(data.message, true);
          return;
        }

        window.location = "<?= DIRECTUS_PATH ?>"+path;

      },
      error: function(jqXHR, textStatus, errorThrown) {
        message("Server error occurred. (" + textStatus + ")", true);
      }
    });
  });

});
</script>
</body>
</html>