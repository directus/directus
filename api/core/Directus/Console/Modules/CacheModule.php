<?php

namespace Directus\Console\Modules;



use Directus\Bootstrap;
use Directus\Console\Exception\WrongArgumentsException;

class CacheModule extends ModuleBase
{
    protected $__module_name = 'cache';
    protected $__module_description = 'clear and get details about cache';

    protected $pool;

    public function __construct()
    {
        $this->commands_help = [
            'clear' => __t('Clear the whole cache'),
            'delete' => __t('Delete cache item'),
            'get' => __t('Get item from cache'),
            'invalidate' => __t('Invalidate specified tags'),
        ];

        $this->help = [
            'clear' => '-f ' . __t('force (do nothing otherwise)'),
            'delete' => __t('Item name'),
            'get' => __t('Item name').'. -e '.__t('to var_export the value (should be used after the value key'),
            'invalidate' => __t('List of tags to invalidate')
        ];

        $helpArrays = [
            'commands_help' => $this->__module_name.':%s – %s',
            'help' => "\t\t".'%2$s'
        ];

        foreach($helpArrays as $arrayName => $format)
        {
            foreach($this->$arrayName as $key => &$value) {
                $this->{$arrayName}[$key] = sprintf($format, $key, $value);
            }
        }

        $this->pool = Bootstrap::get('cache');
    }

    public function cmdInvalidate($args, $extra)
    {
        $this->pool->invalidateTags($extra);
    }

    public function cmdGet($args, $extra)
    {
        if(!empty($extra[0]) && $key = $extra[0]) {
            $item = $this->pool->getItem($key)->get();
            if(empty($args['e'])) {
                echo $item;
            } else {
                var_export($item);
            }
        }
    }

    public function cmdDelete($args, $extra)
    {
        if(isset($extra[0]) && $key = $extra[0]) {
            $this->pool->delete($key);
        }
    }

    public function cmdClear($args, $extra)
    {
        if(empty($args['f'])) {
            throw new WrongArgumentsException($this->__module_name . ':clear ' . __t('Refusing to do anything without -f'));
        }

        $this->pool->clear();
    }

}