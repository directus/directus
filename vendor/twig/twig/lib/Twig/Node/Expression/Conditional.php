<?php

use Twig\Node\Expression\ConditionalExpression;

class_exists('Twig\Node\Expression\ConditionalExpression');

@trigger_error(sprintf('Using the "Twig_Node_Expression_Conditional" class is deprecated since Twig version 2.7, use "Twig\Node\Expression\ConditionalExpression" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\Expression\ConditionalExpression" instead */
    class Twig_Node_Expression_Conditional extends ConditionalExpression
    {
    }
}
