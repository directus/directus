<?php

/**
 * @param string $directory
 *
 * @return array
 */
function getRules($directory)
{
    $rules    = [];
    $iterator = new DirectoryIterator($directory);

    foreach ($iterator as $file) {
        if ($file->isFile() && $file->getExtension() === 'json') {
            $rules[$file->getBasename('.json')] = json_decode(file_get_contents($file->getRealPath()), true);
        }
    }

    return $rules;
}

/**
 * @param string $fileName
 * @param array  $rules
 *
 * @return bool
 */
function insertRules($fileName, array $rules = [])
{
    $startTag = '/*INSERT_START*/';
    $endTag   = '/*INSERT_END*/';

    $content = file_get_contents($fileName);
    $content = preg_replace(
        $regexp = sprintf('#%s(.*)%s#s', quotemeta($startTag), quotemeta($endTag)),
        $startTag.var_export($rules, true).$endTag,
        $content
    );

    return false !== file_put_contents($fileName, $content);
}

$directory = __DIR__.'/../Resources/rules';
$fileName  = __DIR__.'/../src/RuleProvider/DefaultRuleProvider.php';
$rules     = getRules($directory);
ksort($rules);

$result = insertRules($fileName, $rules);

$ruleCount = array_reduce($rules, function ($count, $rules) {
    return $count + count($rules);
}, 0);

if ($result) {
    printf("Written %d rules into '%s'.\n", $ruleCount, $fileName);
} else {
    printf("Error writing rules into '%s'.\n", $fileName);
}

