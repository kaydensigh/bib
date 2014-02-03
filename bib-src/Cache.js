
BIB.imageCache = {};
BIB.fileCache = {};

BIB.ImageData = function (file) {
  this.file = file;
  this.image = new Image();
  this.callbacks = [];

  var that = this;
  this.image.onload = function () {
    that.callbacks.forEach(function (callback) {
      callback(that);
    });
    that.callbacks = null;
  }
  this.image.src = file;
};

BIB.getImageData = function (file, callback) {
  var imageData = BIB.imageCache[file] || new BIB.ImageData(file);
  BIB.imageCache[file] = imageData;

  if (callback) {
    if (imageData.callbacks === null) {
      callback(imageData);
    } else {
      imageData.callbacks.push(callback);
    }
  }

  return imageData;
};

BIB.FileData = function (file) {
  this.file = file;
  this.data;
  this.json;
  this.callbacks = [];

  var xhr = new XMLHttpRequest();
  xhr.open('GET', file);
  var that = this;
  xhr.onload = function (e) {
    that.data = this.response;
    try {
      that.json = JSON.parse(this.response);
    } catch (e) {}
    that.callbacks.forEach(function (callback) {
      callback(that);
    });
    that.callbacks = null;
  };
  xhr.send();
};

BIB.getFileData = function (file, callback) {
  var fileData = BIB.fileCache[file] || new BIB.FileData(file);
  BIB.fileCache[file] = fileData;

  if (callback) {
    if (fileData.callbacks === null) {
      callback(fileData);
    } else {
      fileData.callbacks.push(callback);
    }
  }

  return fileData;
};
