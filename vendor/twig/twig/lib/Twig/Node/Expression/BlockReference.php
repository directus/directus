<?php

use Twig\Node\Expression\BlockReferenceExpression;

class_exists('Twig\Node\Expression\BlockReferenceExpression');

@trigger_error(sprintf('Using the "Twig_Node_Expression_BlockReference" class is deprecated since Twig version 2.7, use "Twig\Node\Expression\BlockReferenceExpression" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\Expression\BlockReferenceExpression" instead */
    class Twig_Node_Expression_BlockReference extends BlockReferenceExpression
    {
    }
}
