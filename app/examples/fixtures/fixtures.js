'use strict';

// BIB world.
var world;

function start() {
  world = new BIB.World('c');
  world.setGravity([0, 9.8]);
  world.setViewSize([16, 12]);

  var descriptors = {
    animations: [
      {
        name: 'ball',
        file: '/images/big.png',
      },
      {
        name: 'block',
        file: '/images/block.jpg',
      },
      {
        name: 'box',
        file: '/images/box.png',
      },
    ],
    kinds: [
      {
        name: 'complex',
        // In Box2D each body has a number of fixtures that are rigidly
        // connected. This simplifies the simulation of complex bodies as each
        // fixture must be one of the supported shapes.
        fixtures: [
          // Bottom.
          {
            shapeType: 'polygon',
            shapeData: [[-3, 2],
                        [3, 2],
                        [3, 3],
                        [-3, 3]],
            properties: {
              density: 100,
              restitution: 0,
            },
          },
          // Left hand side.
          {
            shapeType: 'polygon',
            shapeData: [[-3, -2],
                        [-2, -2],
                        [-2, 3],
                        [-3, 3]],
            // If |properties| or |collisionFilter| are unspecified, each will
            // be inherited from the preceding fixture. This allows giving a
            // list of fixtures the same properties or collision filter without
            // repeating them.
          },
          // Right hand side.
          {
            shapeType: 'polygon',
            shapeData: [[2, -2],
                        [3, -2],
                        [3, 3],
                        [2, 3]],
            properties: {},  // Set to defaults. This body will be heavier on
                             // the left.
          },
        ],
      },
      {
        name: 'hollow',
        animation: 'box',
        fixtures: [
          {
            // A hollow box, so other fixtures can be contained within it.
            shapeType: 'loop',
            shapeData: [[-0.5, -0.5],
                        [0.5, -0.5],
                        [0.5, 0.5],
                        [-0.5, 0.5]],
          },
          // 'loop' and 'chain' shapes have no area and therefore no mass.
          // Add a shape with mass so that it behaves as expected.
          {
            shapeType: 'box',
            collisionFilter: {
              collisionCategories: [],  // Collide with nothing.
            },
          },
        ],
      },
      {
        name: 'ball',
        animation: 'ball',
        fixtures: [
          {
            shapeType: 'circle',
            shapeData: 0.4,
          },
        ],
      },
      {
        name: 'wall',
        animation: 'block',
        fixtures: [{}],  // Default fixture is a [1, 1] box.
        movementType: 'static',
      },
      {
        name: 'background',
        animation: 'block',
        fixtures: [],  // No fixtures (collides with nothing and has no mass).
        movementType: 'static',
      },
    ],
  };

  world.load(descriptors, onLoadComplete);
}

function onLoadComplete(world) {
  var t;

  // Walls around the outside.
  var w = world.viewSize.x;
  var h = world.viewSize.y;
  world.newThing('wall', { position: [-w/2, 0], scale: [1, h] });
  world.newThing('wall', { position: [w/2, 0], scale: [1, h] });
  world.newThing('wall', { position: [0, -h/2], scale: [w, 1] });
  world.newThing('wall', { position: [0, h/2], scale: [w, 1] });

  world.newThing('background', { position: [0, 0], scale: [2, 2] });
  world.newThing('complex', { position: [-2, 0] });
  world.newThing('hollow', { position: [3, 0], scale: [2, 2] });

  // Fill with balls since the complex Thing has no animation.
  for (var x = -7; x <= 7; x++) {
    for (var y = -5; y <= 5; y++) {
      world.newThing('ball', { position: [x, y] });
    }
  }

  world.start();

  // Enabled drawing of fixture outlines.
  world.skeletonLayer.visible = true;
}

window.onload = start;

