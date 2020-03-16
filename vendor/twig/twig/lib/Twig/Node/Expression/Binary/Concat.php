<?php

use Twig\Node\Expression\Binary\ConcatBinary;

class_exists('Twig\Node\Expression\Binary\ConcatBinary');

@trigger_error(sprintf('Using the "Twig_Node_Expression_Binary_Concat" class is deprecated since Twig version 2.7, use "Twig\Node\Expression\Binary\ConcatBinary" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\Expression\Binary\ConcatBinary" instead */
    class Twig_Node_Expression_Binary_Concat extends ConcatBinary
    {
    }
}
