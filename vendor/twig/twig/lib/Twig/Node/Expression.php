<?php

use Twig\Node\Expression\AbstractExpression;

class_exists('Twig\Node\Expression\AbstractExpression');

@trigger_error(sprintf('Using the "Twig_Node_Expression" class is deprecated since Twig version 2.7, use "Twig\Node\Expression\AbstractExpression" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\Expression\AbstractExpression" instead */
    class Twig_Node_Expression extends AbstractExpression
    {
    }
}
