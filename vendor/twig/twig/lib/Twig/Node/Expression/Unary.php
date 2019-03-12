<?php

use Twig\Node\Expression\Unary\AbstractUnary;

class_exists('Twig\Node\Expression\Unary\AbstractUnary');

@trigger_error(sprintf('Using the "Twig_Node_Expression_Unary" class is deprecated since Twig version 2.7, use "Twig\Node\Expression\Unary\AbstractUnary" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\Expression\Unary\AbstractUnary" instead */
    class Twig_Node_Expression_Unary extends AbstractUnary
    {
    }
}
