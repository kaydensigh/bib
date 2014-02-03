'use strict';

// BIB world.
var world;

function start() {
  world = new BIB.World('c');
  world.setViewSize([12, 9]);

  var descriptors = {
    animations: [
      // By default, animations have one frame, i.e. a static image.
      // |name| is an identifier for the animation inside BIB.
      // |file| specifies the image to use.
      // |size| specifies the BIB size of the image. Default is [1, 1].
      {
        name: 'block',
        file: '/images/block.jpg',
        size: [2, 3],
        alpha: 0.5,
      },
      // Images are animated by dividing it into a grid of frames.
      // |size| specifies the size of each frame.
      // |gridDimensions| is the number of [columns, rows] in the grid.
      // |speed| is the time taken to play through all frames.
      {
        name: 'sprite',
        file: '/images/grid.png',
        gridDimensions: [3, 4],
        speed: 3,
      },
      // Multiple animations can be made from the same image.
      // |frameOffset| and |frameCount| can be used to select a subset of frames
      // to use. The example below takes just the middle two rows.
      {
        name: 'one-row',
        file: '/images/grid.png',
        gridDimensions: [3, 4],
        frameOffset: 3,
        frameCount: 6,
        speed: 1,
      },
    ],
    // Animations, like Kinds and Sets can be loaded from json.
    loadAnimations: ['animations.json'],
    kinds: [
      {
        name: 'block',
        // No default animation.
        movementType: 'static',
      },
      {
        name: 'sprite',
        animation: 'sprite',
        movementType: 'static',
      },
    ],
  };

  world.load(descriptors, onLoadComplete);
}

function onLoadComplete(world) {
  var t;
  t = world.newThing('block', {position: [-5, 0]});
  t.setAnimation('block');

  world.newThing('sprite', {position: [-3, 0]});

  // The animations position (from 0 to 1) indicates how far through the
  // animation the current frame is. Setting it to 0.5 here starts it playing
  // half way through.
  t = world.newThing('sprite', {position: [-2, 0]});
  t.actor.setInstant(0.5);

  // Note that setting the position to 1 will get the first frame.
  // Setting the speed to 0 will stop the animation.
  t = world.newThing('sprite', {position: [-1, 0]});
  t.actor.setInstant(0.5);
  t.actor.speed = 0;
  t = world.newThing('sprite', {position: [0, 0]});
  t.actor.setInstant(1);
  t.actor.speed = 0;

  // Setting the speed to negative will play it in reverse. Set the frame to the
  // last frame, since animation stops on the first frame.
  t = world.newThing('sprite', {position: [1, 0]});
  t.actor.speed = -3;
  t.actor.setFrame(-1);

  // Each Things animation can be changed.
  t = world.newThing('sprite', {position: [2, 0]});
  t.setAnimation('one-row');
  t = world.newThing('sprite', {position: [3, 0]});
  t.setAnimation('ball');

  // By default, the action at the end of animation is to stop the animation.
  // This can be set to loop instead.
  t = world.newThing('sprite', {position: [4, 0]});
  t.actor.onAnimationFinished = AnimatedBitmap.LOOP;

  // Change the animation.
  t = world.newThing('sprite', {position: [5, 0]});
  t.actor.onAnimationFinished = function (thing) {
    // Note the instant does not change when changing animation, but can be set.
    thing.setAnimation('explosion');
    thing.actor.setInstant(0);
    thing.actor.onAnimationFinished = function (thing) {
      thing.destroy();
    };
  };

  world.start();
}

window.onload = start;

