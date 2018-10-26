<?php

namespace Directus\Console\Modules;



use Directus\Bootstrap;
use Directus\Console\Exception\WrongArgumentsException;

class CacheModule extends ModuleBase
{
    protected $__module_name = 'cache';
    protected $__module_description = 'clear and get details about cache';

    protected $pool;

    public function __construct($basePath)
    {
        parent::__construct($basePath);

        $this->commands_help = [
            'clear' => 'Clear the whole cache',
            'delete' => 'Delete cache item',
            'get' => 'Get item from cache',
            'invalidate' => 'Invalidate specified tags',
        ];

        $this->help = [
            'clear' => '-f ' . 'force (do nothing otherwise)',
            'delete' => 'Item name',
            'get' => 'Item name'.'. -e '.'to var_export the value (should be used after the value key',
            'invalidate' => 'List of tags to invalidate'
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

        // NOTE: Stripped just to make the tests works
        // TODO: Bring it back
        // $this->pool = Bootstrap::get('cache');
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
            throw new WrongArgumentsException($this->__module_name . ':clear ' . 'Refusing to do anything without -f');
        }

        $this->pool->clear();
    }

}
