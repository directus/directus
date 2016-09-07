<?php

namespace Directus\Console\Modules;

use Directus\Bootstrap;
use Directus\Util\ArrayUtils;


class LanguageModule extends ModuleBase
{

    protected $__module_name = 'language';
    protected $__module_description = 'command to know the missing/removed language keys';
    protected $commands_help;
    protected $help;

    public function __construct()
    {
        $this->help = array(
            'diff' => __t('The Languages difference keys.')
        );

        $this->commands_help = array(
            'diff' => __t('The Languages difference keys.')
        );
    }

    public function cmdHelp($args, $extra)
    {
        echo PHP_EOL . __t('Directus Command ') . $this->__module_name . ':' . $extra[0] . __t(' help') . PHP_EOL . PHP_EOL;
        echo "\t" . $this->commands_help[$extra[0]] . PHP_EOL;
        echo PHP_EOL . PHP_EOL;
    }

    protected function cmdDiff($args, $extra)
    {
        // TODO: Accepts a language code to compare it with another. (Default: English)
        $languageManager = Bootstrap::get('languagesManager');

        $languages = $languageManager->getLanguageList();

        if (count($languages) <= 1) {
            return [];
        }

        $languagesPhrases = [];
        foreach ($languages as $code => $name) {
            $languagesPhrases[] = [
                'code' => $code,
                'name' => $name,
                'phrases_keys' => get_locale_keys($code),
                'diff' => []
            ];
        }

        // =============================================================================
        // A language to compare to the rest of languages keys
        // =============================================================================
        $mainLanguage = $languagesPhrases[0];
        unset($languagesPhrases[0]);

        foreach ($languagesPhrases as $language) {
            $diff = ArrayUtils::missing($mainLanguage['phrases_keys'], $language['phrases_keys']);
            echo "--------------------" . PHP_EOL;
            echo $language['name'] . " has " . count($diff) . " missing/removed keys compared against " . $mainLanguage['name'] . PHP_EOL;
            foreach ($diff as $key) {
                echo "\t - " . $key . PHP_EOL;
            }
            echo "--------------------" . PHP_EOL . PHP_EOL;
        }
    }
}
