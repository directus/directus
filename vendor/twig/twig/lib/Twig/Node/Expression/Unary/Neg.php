<?php

use Twig\Node\Expression\Unary\NegUnary;

class_exists('Twig\Node\Expression\Unary\NegUnary');

@trigger_error(sprintf('Using the "Twig_Node_Expression_Unary_Neg" class is deprecated since Twig version 2.7, use "Twig\Node\Expression\Unary\NegUnary" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\Expression\Unary\NegUnary" instead */
    class Twig_Node_Expression_Unary_Neg extends NegUnary
    {
    }
}
