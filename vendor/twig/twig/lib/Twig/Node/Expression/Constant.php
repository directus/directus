<?php

use Twig\Node\Expression\ConstantExpression;

class_exists('Twig\Node\Expression\ConstantExpression');

@trigger_error(sprintf('Using the "Twig_Node_Expression_Constant" class is deprecated since Twig version 2.7, use "Twig\Node\Expression\ConstantExpression" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\Expression\ConstantExpression" instead */
    class Twig_Node_Expression_Constant extends ConstantExpression
    {
    }
}
