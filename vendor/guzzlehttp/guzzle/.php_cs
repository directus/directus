<?php

$config = PhpCsFixer\Config::create()
    ->setRiskyAllowed(true)
    ->setRules([
        '@PSR2' => true,
        'array_syntax' => ['syntax' => 'short'],
        'declare_strict_types' => false,
        'concat_space' => ['spacing'=>'one'],
        'php_unit_test_case_static_method_calls' => ['call_type' => 'self'],
        'ordered_imports' => true,
        // 'phpdoc_align' => ['align'=>'vertical'],
        // 'native_function_invocation' => true,
    ])
    ->setFinder(
        PhpCsFixer\Finder::create()
            ->in(__DIR__.'/src')
            ->in(__DIR__.'/tests')
            ->name('*.php')
    )
;

return $config;
