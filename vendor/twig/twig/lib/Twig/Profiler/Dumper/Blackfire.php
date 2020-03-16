<?php

use Twig\Profiler\Dumper\BlackfireDumper;

class_exists('Twig\Profiler\Dumper\BlackfireDumper');

@trigger_error(sprintf('Using the "Twig_Profiler_Dumper_Blackfire" class is deprecated since Twig version 2.7, use "Twig\Profiler\Dumper\BlackfireDumper" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Profiler\Dumper\BlackfireDumper" instead */
    class Twig_Profiler_Dumper_Blackfire extends BlackfireDumper
    {
    }
}
