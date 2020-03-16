<?php

use Twig\Node\Expression\MethodCallExpression;

class_exists('Twig\Node\Expression\MethodCallExpression');

@trigger_error(sprintf('Using the "Twig_Node_Expression_MethodCall" class is deprecated since Twig version 2.7, use "Twig\Node\Expression\MethodCallExpression" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\Expression\MethodCallExpression" instead */
    class Twig_Node_Expression_MethodCall extends MethodCallExpression
    {
    }
}
