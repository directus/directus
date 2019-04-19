<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

$usageInstructions = <<<END

  Usage instructions
  -------------------------------------------------------------------------------

  $ cd symfony-code-root-directory/

  # show the translation status of all locales
  $ php translation-status.php

  # show the translation status of all locales and all their missing translations
  $ php translation-status.php -v

  # show the status of a single locale
  $ php translation-status.php fr

  # show the status of a single locale and all its missing translations
  $ php translation-status.php fr -v

END;

$config = [
    // if TRUE, the full list of missing translations is displayed
    'verbose_output' => false,
    // NULL = analyze all locales
    'locale_to_analyze' => null,
    // the reference files all the other translations are compared to
    'original_files' => [
        'src/Symfony/Component/Form/Resources/translations/validators.en.xlf',
        'src/Symfony/Component/Security/Core/Resources/translations/security.en.xlf',
        'src/Symfony/Component/Validator/Resources/translations/validators.en.xlf',
    ],
];

$argc = $_SERVER['argc'];
$argv = $_SERVER['argv'];

if ($argc > 3) {
    echo str_replace('translation-status.php', $argv[0], $usageInstructions);
    exit(1);
}

foreach (array_slice($argv, 1) as $argumentOrOption) {
    if (0 === strpos($argumentOrOption, '-')) {
        $config['verbose_output'] = true;
    } else {
        $config['locale_to_analyze'] = $argumentOrOption;
    }
}

foreach ($config['original_files'] as $originalFilePath) {
    if (!file_exists($originalFilePath)) {
        echo sprintf('The following file does not exist. Make sure that you execute this command at the root dir of the Symfony code repository.%s  %s', PHP_EOL, $originalFilePath);
        exit(1);
    }
}

$totalMissingTranslations = 0;

foreach ($config['original_files'] as $originalFilePath) {
    $translationFilePaths = findTranslationFiles($originalFilePath, $config['locale_to_analyze']);
    $translationStatus = calculateTranslationStatus($originalFilePath, $translationFilePaths);

    $totalMissingTranslations += array_sum(array_map(function ($translation) {
        return \count($translation['missingKeys']);
    }, array_values($translationStatus)));

    printTranslationStatus($originalFilePath, $translationStatus, $config['verbose_output']);
}

exit($totalMissingTranslations > 0 ? 1 : 0);

function findTranslationFiles($originalFilePath, $localeToAnalyze)
{
    $translations = [];

    $translationsDir = dirname($originalFilePath);
    $originalFileName = basename($originalFilePath);
    $translationFileNamePattern = str_replace('.en.', '.*.', $originalFileName);

    $translationFiles = glob($translationsDir.'/'.$translationFileNamePattern);
    foreach ($translationFiles as $filePath) {
        $locale = extractLocaleFromFilePath($filePath);

        if (null !== $localeToAnalyze && $locale !== $localeToAnalyze) {
            continue;
        }

        $translations[$locale] = $filePath;
    }

    return $translations;
}

function calculateTranslationStatus($originalFilePath, $translationFilePaths)
{
    $translationStatus = [];
    $allTranslationKeys = extractTranslationKeys($originalFilePath);

    foreach ($translationFilePaths as $locale => $translationPath) {
        $translatedKeys = extractTranslationKeys($translationPath);
        $missingKeys = array_diff_key($allTranslationKeys, $translatedKeys);

        $translationStatus[$locale] = [
            'total' => \count($allTranslationKeys),
            'translated' => \count($translatedKeys),
            'missingKeys' => $missingKeys,
        ];
    }

    return $translationStatus;
}

function printTranslationStatus($originalFilePath, $translationStatus, $verboseOutput)
{
    printTitle($originalFilePath);
    printTable($translationStatus, $verboseOutput);
    echo PHP_EOL.PHP_EOL;
}

function extractLocaleFromFilePath($filePath)
{
    $parts = explode('.', $filePath);

    return $parts[count($parts) - 2];
}

function extractTranslationKeys($filePath)
{
    $translationKeys = [];
    $contents = new \SimpleXMLElement(file_get_contents($filePath));

    foreach ($contents->file->body->{'trans-unit'} as $translationKey) {
        $translationId = (string) $translationKey['id'];
        $translationKey = (string) $translationKey->source;

        $translationKeys[$translationId] = $translationKey;
    }

    return $translationKeys;
}

function printTitle($title)
{
    echo $title.PHP_EOL;
    echo str_repeat('=', strlen($title)).PHP_EOL.PHP_EOL;
}

function printTable($translations, $verboseOutput)
{
    if (0 === count($translations)) {
        echo 'No translations found';

        return;
    }
    $longestLocaleNameLength = max(array_map('strlen', array_keys($translations)));

    foreach ($translations as $locale => $translation) {
        $isTranslationCompleted = $translation['translated'] === $translation['total'];
        if ($isTranslationCompleted) {
            textColorGreen();
        }

        echo sprintf('| Locale: %-'.$longestLocaleNameLength.'s | Translated: %d/%d', $locale, $translation['translated'], $translation['total']).PHP_EOL;

        textColorNormal();

        if (true === $verboseOutput && \count($translation['missingKeys']) > 0) {
            echo str_repeat('-', 80).PHP_EOL;
            echo '| Missing Translations:'.PHP_EOL;

            foreach ($translation['missingKeys'] as $id => $content) {
                echo sprintf('|   (id=%s) %s', $id, $content).PHP_EOL;
            }

            echo str_repeat('-', 80).PHP_EOL;
        }
    }
}

function textColorGreen()
{
    echo "\033[32m";
}

function textColorNormal()
{
    echo "\033[0m";
}
