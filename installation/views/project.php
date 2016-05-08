<div class="container">
    <?php if ($step->getResponse()): ?>
    <p><?=$step->getResponse()->getErrorMessage(); ?></p>
    <?php endif; ?>
    <label for="directus_name">Project Name</label><input type="text" id="directus_name" name="directus_name" placeholder="My Project Name" value="<?php echo($step->getData('directus_name') ? $step->getData('directus_name') : ''); ?>" autofocus><br>
    <label for="directus_path">Project Path</label><input type="text" id="directus_path" name="directus_path" placeholder="Path to Directus directory" value="<?php echo($step->getData('directus_path') ? $step->getData('directus_path') : $root_path); ?>"><br>
    <label for="directus_email">Admin Email</label><input type="email" id="directus_email" name="directus_email" placeholder="admin@example.com" value="<?php echo($step->getData('directus_email') ? $step->getData('directus_email') : ''); ?>"><br>
    <label for="directus_password">Admin Password</label><input type="password" id="directus_password" name="directus_password" value="<?php echo($step->getData('directus_password') ? $step->getData('directus_password') : ''); ?>"><br>
    <label for="directus_password_confirm">Confirm Admin Password</label><input type="password" id="directus_password_confirm" name="directus_password_confirm" value="<?php echo($step->getData('directus_password_confirm') ? $step->getData('directus_password_confirm') : ''); ?>"><br>
</div>
