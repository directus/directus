<div class="container">
    <?php if ($step->getResponse()): ?>
        <h2><?=$step->getResponse()->getErrorMessage(); ?></h2>
    <?php endif; ?>
    <p>Refresh this page when the problems above are resolved.</p>
</div>
