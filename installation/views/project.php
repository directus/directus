<div class="container">
    <?php include __DIR__ . '/partials/errors.php'; ?>
    <label for="directus_name"><?= __t('Project Name'); ?></label><input type="text" id="directus_name"
                                                                         name="directus_name"
                                                                         placeholder="<?= __t('eg: My Project Name'); ?>"
                                                                         value="<?php echo($step->getSafeData('directus_name') ? $step->getSafeData('directus_name') : ''); ?>"
                                                                         autofocus><br>
    <label for="directus_path"><?= __t('Project Path'); ?></label><input type="text" id="directus_path"
                                                                         name="directus_path"
                                                                         placeholder="<?= __t('Path to Directus directory'); ?>"
                                                                         value="<?php echo($step->getSafeData('directus_path') ? $step->getSafeData('directus_path') : $root_path); ?>"><br>
    <label for="directus_email"><?= __t('Admin Email'); ?></label><input type="email" id="directus_email"
                                                                         name="directus_email"
                                                                         placeholder="<?= __t('eg: admin@example.com'); ?>"
                                                                         value="<?php echo($step->getSafeData('directus_email') ? $step->getSafeData('directus_email') : ''); ?>"><br>
    <label for="directus_password"><?= __t('Admin Password'); ?></label><input type="password" id="directus_password"
                                                                               name="directus_password"
                                                                               value="<?php echo($step->getSafeData('directus_password') ? $step->getSafeData('directus_password') : ''); ?>"><br>
    <label for="directus_password_confirm"><?= __t('Confirm Admin Password'); ?></label><input type="password"
                                                                                               id="directus_password_confirm"
                                                                                               name="directus_password_confirm"
                                                                                               value="<?php echo($step->getSafeData('directus_password_confirm') ? $step->getSafeData('directus_password_confirm') : ''); ?>"><br>
</div>
