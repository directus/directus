<?php
/**
 * @todo  this needs a real templating arrangement that can access the
 * application stack, or else it needs the api to drop a few system
 * settings into the JSON initialization data.
 */
require "api/config.php";
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
  <link href='http://fonts.googleapis.com/css?family=Open+Sans:400,600' rel='stylesheet' type='text/css'>
  <link href='http://fonts.googleapis.com/css?family=Arvo' rel='stylesheet' type='text/css'>
  <link rel="stylesheet" href="/directus/assets/css/index.css">
  <style>
    body {background-image: url(assets/img/noise.gif); margin:0; padding:0;}
    .login-panel { background-color:rgba(255,255,255,0.4); padding:20px; width:372px; box-shadow: 0px 1px 10px 0px rgba(0,0,0,0.05); position: absolute; left:50%; top:50%; margin-left:-208px; margin-top:-245px;}
    input[type="text"], input[type="password"] {font-size:16px; width:360px; border:0;  margin-bottom:20px; height:30px; line-height:30px;} 
    input[type="submit"] { display:block; width:370px; }
    label {margin-bottom:20px; font-weight:normal;}
    h2 {font-size:26px; margin-bottom:20px; margin-top:0px;}
  </style>
</head>

<body>
<!-- Main container. -->
<form action="<?php echo DIRECTUS_PATH; ?>api/1/auth/login" method="post">
<div class='login-panel'>
  <h2>Welcome!</h2>
  <input type="text" name="email" placeholder="Email" />
  <input type="password" name="password" placeholder="Password" />
  <label class="checkbox">
      <input type="checkbox" name="remember" /> Keep me logged in on this computer
  </label>
  <input type="submit" class="btn btn-primary" value="Sign in" />
</div>
</form>

</body>
</html>