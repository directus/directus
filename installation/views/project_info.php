<div class="container">
  Project Name<input type="text" name="site_name" value="<?= isset($site_name) ? $site_name : '' ?>"><br>
  Project Path<input type="text" name="directus_path" value="<?php isset($root_path) ? $root_path : '' ?>"><br>
  Admin Email<input type="email" name="email" value="<?= isset($email) ? $email : ''; ?>"><br>
  Admin Password<input type="password" name="password" value="<?= isset($password) ? $password : '' ?>"><br>
  Confirm Admin Password<input type="password" name="password_confirm" value="<?= isset($password) ? $password : ''; ?>"><br>
</div>
