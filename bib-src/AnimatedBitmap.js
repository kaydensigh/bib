
// Added within IvanK framework.

/**
 * A DisplayObjectContainer that adds to its children one Bitmap for each frame
 * of a BIB.Animation. It animates them by setting |visible| and |alpha| on each
 * Bitmap.
 */
function AnimatedBitmap(additionalOffset)
{
  DisplayObjectContainer.call(this);

  // This actors parent Thing.
  this.thing = null;

  // By default (onAnimationFinished == null) animation stops on the last
  // frame (or first if speed is negative).
  // If onAnimationFinished is set, it will be called with |this.thing| and its
  // return value will determine whether to continue the animation.
  // E.g. Set this to AnimatedBitmap.LOOP to loop the animation.
  // Otherwise, set a custom function to do other actions.
  this.onAnimationFinished = null;

  // Additional offset of this animation from the Thing.
  this.additionalOffset = additionalOffset;
  // Seconds taken to play the animation.
  this.speed = 0;
  // Current position of the animation as a proportion in [0, 1).
  this.instant = 0;

  this.setInstant(0);
}
AnimatedBitmap.prototype = new DisplayObjectContainer();

/**
 * Sets the animation.
 */
AnimatedBitmap.prototype.setAnimation = function (animation) {
  this.removeChildren();
  if (!animation) {
    return;
  }
  animation.bitmapData.forEach(function (bitmapData) {
    var bitmap = new Bitmap(bitmapData);
    var offsetX = animation.offset.x + this.additionalOffset.x;
    var offsetY = animation.offset.y + this.additionalOffset.y;
    bitmap.scaleX = animation.size.x / animation.width;
    bitmap.scaleY = animation.size.y / animation.height;
    bitmap.x = animation.size.x * (-0.5 + offsetX);
    bitmap.y = animation.size.y * (-0.5 + offsetY);
    bitmap.visible = false;
    this.addChild(bitmap);
  }, this);
  this.speed = animation.speed;
  // Set the alpha and blendMode (in DisplayObject).
  this.alpha = animation.alpha;
  this.blendMode = animation.blendMode;

  // Make the current frame visible.
  this.setInstant(this.instant);
}

/**
 * Sets the current position in the animation.
 */
AnimatedBitmap.prototype.setInstant = function (instant)
{
  if (this.numChildren == 0) {
    return;
  }

  // Bound instant to [0, 1).
  instant = instant % 1;
  if (instant < 0) {
    instant += 1;
  }

  var currentFrame = (this.numChildren * this.instant) | 0;
  var newFrame = (this.numChildren * instant) | 0;

  this.getChildAt(currentFrame).visible = false;
  this.getChildAt(newFrame).visible = true;

  this.instant = instant;
}

/**
 * Get and set the current frame.
 */
AnimatedBitmap.prototype.getFrame = function (frame) {
  return (this.numChildren * this.instant) | 0;
}
AnimatedBitmap.prototype.setFrame = function (frame) {
  this.setInstant(frame / this.numChildren);
}

/**
 * Steps the animation by the time interval.
 */
AnimatedBitmap.prototype.step = function (interval)
{
  if (this.speed == 0) {
    return;
  }

  var newInstant = (this.instant + (interval / this.speed) % 1);

  // If the animation is finished, don't proceed.
  if ((newInstant >= 1 || newInstant < 0) &&
      (!this.onAnimationFinished || !this.onAnimationFinished(this.thing))) {
    return;
  }
  this.setInstant(newInstant);
}

/**
 * Do nothing and return true to have the animation loop.
 */
AnimatedBitmap.LOOP = function (thing) { return true; };
