---
layout: default
permalink: /adapter/azure/
title: Azure Blob Storage
---

# Azure Blob Storage

## Installation

~~~ bash
composer require league/flysystem-azure
~~~

## Usage

~~~ php
use WindowsAzure\Common\ServicesBuilder;
use League\Flysystem\Filesystem;
use League\Flysystem\Azure\AzureAdapter;

$endpoint = sprintf(
    'DefaultEndpointsProtocol=https;AccountName=%s;AccountKey=%s',
    'account-name',
    'api-key'
);

$blobRestProxy = ServicesBuilder::getInstance()->createBlobService($endpoint);

$filesystem = new Filesystem(new AzureAdapter($blobRestProxy, 'my-container'));
~~~
