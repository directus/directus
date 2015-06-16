define(function() {

  'use strict';

  var ImageHelper = {
    isImage: function(url, fn) {
      var img = new Image();
      
      img.onload =  function() {
        fn(true, url);
      }
      
      img.onerror = function() {
        fn(false, url);
      }

      img.src = url;
    },

    getDataFromInput: function(inputFile, fn) {
      var imageType = /image.*/;
      var imageDetails = {
        width: 0,
        height: 0
      };

      if (inputFile.type.match(imageType)) {
        var reader = new FileReader();
        reader.onload = function() {
          imageDetails.width = this.width;
          imageDetails.height = this.height;
          fn(reader.result,  imageDetails, inputFile);
        }

        reader.readAsDataURL(inputFile); 
      } else {
        fn(null, imageDetails, inputFile);
      }
    },

    getDataDetails: function(data, fn) {
      var img = new Image();

      img.onerror = function() {
        fn(null, data);
      };

      img.onload = function() {
        var details = {
          width: this.width,
          height: this.height
        };

        fn(details, data);
      };

      img.src = data;
    },

    // this method try to fit a image
    // into a box [width]x[height]
    // no fancy resizing
    resizeFromData: function(fileData, thumbnailWidth, thumbnailHeight, fn) {
      var img = new Image();
      img.src = fileData;
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

        var canvas = document.createElement("canvas");
        canvas.width = MAX_WIDTH;
        canvas.height = MAX_HEIGHT;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, x, y, width, height);

        var dataurl = canvas.toDataURL("image/png");
        fn(dataurl);
      }
      img.onerror = function() {
        fn(null);
      }
    }
  };

  return ImageHelper;
});