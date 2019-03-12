<?php

use Twig\Profiler\Dumper\BaseDumper;

class_exists('Twig\Profiler\Dumper\BaseDumper');

@trigger_error(sprintf('Using the "Twig_Profiler_Dumper_Base" class is deprecated since Twig version 2.7, use "Twig\Profiler\Dumper\BaseDumper" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Profiler\Dumper\BaseDumper" instead */
    class Twig_Profiler_Dumper_Base extends BaseDumper
    {
    }
}
