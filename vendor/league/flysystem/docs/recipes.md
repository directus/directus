---
layout: default
permalink: /recipes/
title: Recipes
---

# Recipes

Flysystem Recipes describe common tasks and/or describe prefered ways to deal with
a problem. Please consider contributing a recipe. Contributions are very welcome!

## Handling uploads

### Plain PHP Upload

~~~ php
$stream = fopen($_FILES[$uploadname]['tmp_name'], 'r+');
$filesystem->writeStream('uploads/'.$_FILES[$uploadname]['name'], $stream);
fclose($stream);
~~~

### Symfony Upload

~~~ php
/** @var Symfony\Component\HttpFoundation\Request $request */
/** @var Symfony\Component\HttpFoundation\File\UploadedFile $file */
$file = $request->files->get($uploadname);

if ($file->isValid()) {
    $stream = fopen($file->getRealPath(), 'r+');
    $filesystem->writeStream('uploads/'.$file->getClientOriginalName(), $stream);
    fclose($stream);
}
~~~

### Laravel 5 - DI

~~~ php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class UploadController extends Controller {

    /**
     * Upload a file.
     *
     * @param  Request  $request
     * @return Response
     */
    public function store(Request $request, FilesystemInterface $filesystem)
    {
        $file = $request->file('upload');
        $stream = fopen($file->getRealPath(), 'r+');
        $filesystem->writeStream('uploads/'.$file->getClientOriginalName(), $stream);
        fclose($stream);
    }
}
~~~

### Laravel 4/5 - Static-Access Proxy

~~~ php
$file = Request::file($uploadname);

if ($file->isValid()) {
    $stream = fopen($file->getRealPath(), 'r+');
    $filesystem->writeStream('uploads/'.$file->getClientOriginalName(), $stream);
    fclose($stream);
}
~~~

### Yii 2 Upload

~~~ php
<?php

namespace app\controllers;

use yii\web\Controller;
use yii\web\UploadedFile;

class FileController extends Controller
{
    public function actionUpload()
    {
        $file = UploadedFile::getInstanceByName($uploadname);
        
        if ($file->error === UPLOAD_ERR_OK) {
            $stream = fopen($file->tempName, 'r+');
            $filesystem->writeStream('uploads/'.$file->name, $stream);
            fclose($stream);
        }
    }
}
~~~
