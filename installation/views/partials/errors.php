<?php if ($step->getResponse()): ?>
    <?php foreach($step->getResponse()->getErrors() as $message): ?>
        <p><?=$message?></p>
    <?php endforeach; ?>
<?php endif; ?>
