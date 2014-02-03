// The very basics:
// - BIB uses SI units, like Box2D.
// - Coordinate system:
//     .-->  x
//     |
//     v  y

'use strict';

// BIB world.
var world;

function start() {
  // This is where the BIB world is defined and created.
  // Note (in basic.html) that the canvas is inside a div, and the div is made
  // to fill the entire window. Move and size the div to move the BIB canvas,
  // BIB will adjust the canvas to fill the div.

  // BIB.World takes ownership of the canvas.
  world = new BIB.World('c');

  // These world parameters all have initial defaults but can be modified at
  // run time.

   // |gravity| is the gravity vector in the Box2D b2World. Default is [0, 0].
  world.setGravity([0, 9.8]);

   // |viewPosition| centers the view at this position. Default is [0, 0].
  world.setViewPosition([0, 0]);

  // |viewSize| is the size of the visible area. BIB will adjust the size of
  // the canvas to maintain the aspect ratio of |viewSize|. Default is [15, 10].
  world.setViewSize([8, 6]);

  // |onEnterFrameActions| is called before each frame is drawn. Default is an
  // empty function.
  world.onEnterFrameActions = onEnterFrameActions;

  // Objects in the BIB world are defined using JSON-able descriptors.
  var descriptors = {
    // |animations| is a list of sprites to use to draw objects.
    animations: [
      {
        name: 'ball',
        file: '/images/big.png',
      },
      {
        name: 'block',
        file: '/images/block.jpg',
      },
    ],

    // |kinds| is a list of Kind descriptors. Kinds are classes of objects.
    kinds: [
      {
        name: 'item',
        animation: 'ball',
        fixtures: [{ shapeType: 'circle' }],
      },
      {
        name: 'wall',
        animation: 'block',
        fixtures: [{ shapeType: 'box' }],
        movementType: 'static',
      },
    ],
  };

  // |load| takes a set of descriptors, and a callback to call when loading
  // finishes.
  world.load(descriptors, onLoadComplete);
}

function onLoadComplete(world) {
  // A Thing is an instance of a Kind.
  // Fill the world with Things by calling |newThing|.
  // |newThing| takes a dictionary of initial parameters.
  world.newThing('item', { position: [0, -1] });
  world.newThing('item', { position: [-0.3, -2], alpha: 0.5 });
  world.newThing('item', { position: [0.3, -3], angle: Math.PI });
  world.newThing('item', { velocity: [10, 0] });

  // Build some walls to contain the items.
  world.newThing('wall', { position: [0, 2.5], scale: [7, 1] });
  world.newThing('wall', { position: [-3.5, 0], scale: [1, 5] });
  world.newThing('wall', { position: [3.5, 0], scale: [1, 5] });

  // Start simulating and rendering the world.
  world.start();
}

function onEnterFrameActions(world) {
  // Nothing here, have a look at the other samples.
}

window.onload = start;

