<?php

use Twig\Node\Expression\CallExpression;

class_exists('Twig\Node\Expression\CallExpression');

@trigger_error(sprintf('Using the "Twig_Node_Expression_Call" class is deprecated since Twig version 2.7, use "Twig\Node\Expression\CallExpression" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\Expression\CallExpression" instead */
    class Twig_Node_Expression_Call extends CallExpression
    {
    }
}
