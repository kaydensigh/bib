BIB.Animation = function (animation) {
  var b2Vec2          = box2d.b2Vec2;

  this.name = animation.name;
  this.file = animation.file;

  // The BIB size (in meters) of each frame.
  this.size = BIB.arrayTob2Vec2(animation.size) || new b2Vec2(1, 1);

  // The BIB offset. Used to set the origin relative to the frame.
  this.offset = BIB.arrayTob2Vec2(animation.offset) || new b2Vec2();

  // The default alpha value.
  this.alpha = (typeof animation.alpha == 'number') ? animation.alpha : 1;

  // The time in seconds to play this animation.
  this.speed = (typeof animation.speed == 'number') ? animation.speed : 0;

  // Number of frames in each direction.
  this.gridDimensions =
      BIB.arrayTob2Vec2(animation.gridDimensions) || new b2Vec2();
  this.gridDimensions.x = this.gridDimensions.x || 1;
  this.gridDimensions.y = this.gridDimensions.y || 1;
  // Total number of frames.
  this.frameCount = animation.frameCount ||
                    this.gridDimensions.x * this.gridDimensions.y;
  // The first frame.
  this.frameOffset = animation.frameOffset || 0;

  // A BitmapData of each frame.
  this.bitmapData = [];
  // The size of each frame in image pixels.
  this.width;
  this.height;

  // The default blend mode.
  this.blendMode = (typeof animation.blendMode == 'string')
      ? animation.blendMode : 'normal';
};

BIB.Animation.prototype.initialize = function () {
  var image = BIB.getImageData(this.file).image;
  var skip = this.frameOffset;
  this.width = (image.width / this.gridDimensions.x) | 0;
  this.height = (image.height / this.gridDimensions.y) | 0;
  for (var y = 0; y < this.gridDimensions.y; y++) {
    for (var x = 0; x < this.gridDimensions.x; x++) {
      if (skip > 0) {
        skip--;
        continue;
      }
      if (this.bitmapData.length == this.frameCount) {
        return;
      }
      var x0 = x * this.width;
      var y0 = y * this.height;
      this.bitmapData.push(new BitmapData(new SubImage(
          image, x0, y0, this.width, this.height)));
    }
  }
};
