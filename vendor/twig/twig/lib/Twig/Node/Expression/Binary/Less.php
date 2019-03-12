<?php

use Twig\Node\Expression\Binary\LessBinary;

class_exists('Twig\Node\Expression\Binary\LessBinary');

@trigger_error(sprintf('Using the "Twig_Node_Expression_Binary_Less" class is deprecated since Twig version 2.7, use "Twig\Node\Expression\Binary\LessBinary" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\Expression\Binary\LessBinary" instead */
    class Twig_Node_Expression_Binary_Less extends LessBinary
    {
    }
}
