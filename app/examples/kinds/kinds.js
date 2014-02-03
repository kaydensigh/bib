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
        name: 'chicken',
        file: '/images/chicken.png',
        size: [11, 9],
      },
    ],
    // Each Kind descriptor is a dictionary of parameters describing the Kind.
    // Most fields (except |name|) have defaults or can be undefined.
    kinds: [
      {
        // |name| is an identifier used in BIB.
        name: 'ball',
        // |animation| is the default animation for Things of this Kind.
        animation: 'ball',
        // |animationOffset| is the position of the animation relative to the
        // Thing.
        animationOffset: [0, 0],

        // |fixtures| defines shape and physical properties.
        fixtures: [
          {
            // BIB will build a shape for this Kind based on |shapeType| and
            // |shapeData|. The expected types and their data are:
            // - 'circle': the radius of the circle
            // - 'box': either the half width, or a 2 element array with the
            //          half width and half height, e.g. [1, 2]
            // - 'polygon': an array of coordinates for each vertex, clockwise
            // - 'chain', 'loop': an array of coordinates for each vertex
            shapeType: 'circle',
            shapeData: 0.4,

            // These are properties of the fixture. The values listed here are
            // the BIB defaults.
            properties: {
              density: 10,
              friction: 0.5,
              restitution: 0.2,
            },

            // This specifies how this fixture collides with others. Leaving it
            // default for this example.
            collisionFilter: {},
          },
        ],

        // The following are all properties of the Box2D body and the values
        // listed here are the BIB defaults.
        movementType: 'dynamic',
        linearDamping: 0,
        angularDamping: 0.01,
        fixedRotation: false,
      },
      {
        name: 'wall',
        animation: 'block',
        fixtures: [
          {
            // |shapeType| is 'box' by default.
            // |shapeData| is 0.5 by default.
          },
        ],
        movementType: 'static',
      },
      {
        name: 'chicken',
        animation: 'chicken',
        fixtures: [
          {
            shapeType: 'polygon',
            shapeData: [
              [-4.5, 1],
              [1.5, -3.5],
              [5.5, -1.5],
              [0.5, 4.5],
              [-1.5, 4.5],
            ],
            properties: {
              density: 100,
              restitution: 1,
            },
          },
        ],
      },
      {
        // This has everything shifted to the right.
        name: 'stirrer',
        animation: 'block',
        animationOffset: [1, 0],
        fixtures: [
          {
            shapeType: 'polygon',
            shapeData: [
              [0.5, -0.5],
              [1.5, -0.5],
              [1.5, 0.5],
              [0.5, 0.5],
            ],
          },
        ],
        movementType: 'kinematic',
      },
    ],
  };

  world.load(descriptors, onLoadComplete);
}

function onLoadComplete(world) {
  var t;

  // A few balls.
  world.newThing('ball');
  world.newThing('ball');
  world.newThing('ball');
  world.newThing('ball');
  world.newThing('ball');
  world.newThing('ball');

  // And a chicken.
  world.newThing('chicken', { scale: [0.2, 0.2] });

  // The stirrer is kinematic, it is moved by setting its speed.
  t = world.newThing('stirrer', { scale: [6, 1] });
  t.body.SetAngularVelocity(0.5);

  // Walls around the outside.
  var w = world.viewSize.x;
  var h = world.viewSize.y;
  world.newThing('wall', { position: [-w/2, 0], scale: [1, h] });
  world.newThing('wall', { position: [w/2, 0], scale: [1, h] });
  world.newThing('wall', { position: [0, -h/2], scale: [w, 1] });
  world.newThing('wall', { position: [0, h/2], scale: [w, 1] });

  // Look up a Kind and loop over all Things.
  world.allKinds['wall'].forEachThing(function (thing) {
    thing.actor.alpha = 0.5;  // Set the transparency.
  });

  world.start();
}

window.onload = start;

