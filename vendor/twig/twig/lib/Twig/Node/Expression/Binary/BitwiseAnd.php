<?php

use Twig\Node\Expression\Binary\BitwiseAndBinary;

class_exists('Twig\Node\Expression\Binary\BitwiseAndBinary');

@trigger_error(sprintf('Using the "Twig_Node_Expression_Binary_BitwiseAnd" class is deprecated since Twig version 2.7, use "Twig\Node\Expression\Binary\BitwiseAndBinary" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\Expression\Binary\BitwiseAndBinary" instead */
    class Twig_Node_Expression_Binary_BitwiseAnd extends BitwiseAndBinary
    {
    }
}
