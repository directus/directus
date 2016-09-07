<?php if ($step->getResponse()): ?>
    <div class="errors">
        <?php foreach ($step->getResponse()->getErrors() as $message): ?>
            <p><?= __t($message); ?></p>
        <?php endforeach; ?>
    </div>
<?php endif; ?>
