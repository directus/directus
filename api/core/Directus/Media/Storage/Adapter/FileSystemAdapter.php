<?php

namespace Directus\Media\Storage\Adapter;

class FileSystemAdapter extends Adapter {

	protected function fileExists($fileName, $destination) {
		$path = $this->joinPaths($destination, $fileName);
		return file_exists($path);
	}

	protected function writeFile($localFile, $targetFileName, $destination) {
		$path = $this->joinPaths($destination, $targetFileName);
		return move_uploaded_file($localFile, $path);
	}

}
