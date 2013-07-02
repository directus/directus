<?php

namespace Directus\Media\Storage;

class Storage {
	
	const ADAPTER_NAMESPACE = "\\Directus\\Media\\Storage\\Adapter";

	public $adapter;
	protected $adapterDestination;

	public function __construct($adapterName, $adapterDestination) {
		$adapterClass = self::ADAPTER_NAMESPACE . "\\$adapterName";
		if(!class_exists($adapterClass)) {
			throw new RuntimeException("No such adapter class: $adapterClass");
		}
		$this->adapter = new $adapterClass;
		$this->adapterDestination = $adapterDestination;
	}

	public function acceptFile($localFile, $targetFileName) {
		$finalPath = $this->adapter->acceptFile($localFile, $targetFileName, $this->adapterDestination);
		return $finalPath;
	}

}
