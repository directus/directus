define(['jquery'], function ($) {

  'use strict';

  var FileHelper = {};

  FileHelper.isImage = function(image, fn) {
    if (this.isFileObject(image)) {
      var imageType = /image.*/;
      if (image.type.match(imageType)) {
        fn(true, image);
      } else {
        fn(false, image);
      }
    } else {
      var img = new Image();
      img.onload = function() {
        fn(true, image);
      };

      img.onerror = function() {
        fn(false, image);
      };

      img.src = image;
    }
  };

  FileHelper.isFileObject = function(file) {
    return typeof File !== 'undefined' ? file instanceof File : false;
  };

  FileHelper.getDataFromInput = function(inputFile, fn) {
    var imageDetails = {
      width: 0,
      height: 0
    };
    var self = this;

    this.isImage(inputFile, function(isImage) {
      var reader = new FileReader();
      reader.onload = function() {
        if (isImage) {
          self.getImageDetails(reader.result, function(imageDetails) {
            fn(reader.result,  imageDetails, inputFile);
          });
        } else {
          fn(reader.result, imageDetails, inputFile);
        }
      };

      reader.readAsDataURL(inputFile);
    });
  };

  FileHelper.getDataFromURL = function(url, fn) {
    var self = this;
    this.isImage(url, function(isImage) {
      self.getImageDetails(url, function(imageDetails) {
        imageDetails.name = imageDetails.title = url.substring(url.lastIndexOf('/')+1);
        fn(url, imageDetails);
      });
    });
  };

  FileHelper.getImageDetails = function(image, fn) {
    var img = new Image();
    var self = this;

    img.onerror = function() {
      fn(null, image);
    };

    img.onload = function() {
      var details = {
        width: this.width,
        height: this.height
      };

      var canvas = document.createElement('canvas');
      canvas.width = this.width;
      canvas.height = this.height;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, this.width, this.height);

      var dataurl = canvas.toDataURL('image/jpg');
      details.data = dataurl;
      details.size = self.getSizeFromData(dataurl);

      fn(details, image);
    };

    img.src = image;
  };

  // this method try to fit a image
  // into a box [width]x[height]
  // no fancy resizing
  FileHelper.resizeFromData = function(image, thumbnailWidth, thumbnailHeight, fn) {
    var img = new Image();

    img.onload = function() {
      var MAX_WIDTH = thumbnailWidth;
      var MAX_HEIGHT = thumbnailHeight;
      var width = this.width;
      var height = this.height;
      var x = 0;
      var y = 0;

      if (width > height) {
        if (width > MAX_WIDTH) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
          x = -(width/2 - MAX_WIDTH/2);
        }
      } else if (width < height) {
        if (height > MAX_HEIGHT) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
          y = -(height/2 - MAX_HEIGHT/2);
        }
      } else {
        width = MAX_WIDTH;
        height = MAX_HEIGHT;
      }

      var canvas = document.createElement('canvas');
      canvas.width = MAX_WIDTH;
      canvas.height = MAX_HEIGHT;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, x, y, width, height);

      var dataurl = canvas.toDataURL('image/jpg');
      fn(dataurl);
    };

    img.onerror = function() {
      fn(null);
    };

    img.src = image;
  };

  // Source: https://en.wikipedia.org/wiki/Base64#MIME
  // The size of the decoded data can be approximated with this formula:
  FileHelper.getSizeFromData = function(data) {
    return (data.length - 814) / 1.37;
  };

  FileHelper.readableBytes = function(size, precision) {
    var info = this.humanBytesInfo(size, precision);

    return info.size + ' ' + info.unit;
  };

  FileHelper.humanBytesInfo = function(size, precision) {
    precision = precision || 0;
    var i = 0;
    var humanSize;
    var unit;

    while ((size/1024) > 0.9) {
      size /= 1024;
      i++;
    }

    humanSize = Math.round(size);
    unit = getUnit(i);

    return {
      size: humanSize.toFixed(precision),
      unit: unit
    };
  };

  FileHelper.humanReadableSize = function (size, precision) {
    var info = this.humanBytesInfo(size, precision);

    return info.size + info.unit;
  };

  function getUnit(index) {
    return ['B','KB','MB','GB','TB','PB','EB','ZB','YB'][index];
  }

  FileHelper.onImageError = function (elements, fn) {
    $(elements).one('error', function (event) {
      fn.apply(event.target, [event, event.target]);
    });
  };

  FileHelper.hideOnImageError = function (elements) {
    this.onImageError(elements, function () {
      $(this).hide();
    });
  };

  FileHelper.getSubType = function (mimeType) {
    return mimeType.split('/').pop();
  };

  // show jpeg as jpg
  FileHelper.friendlySubtype = function (type) {
    type = (type || '').toLowerCase();

    // if mime type is passed instead of a subtype
    type = this.getSubType(type);

    switch (type) {
      case 'jpeg':
        type = 'jpg';
    }

    return type;
  };

  return FileHelper;
});
