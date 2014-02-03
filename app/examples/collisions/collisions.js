'use strict';

// BIB world.
var world;

function start() {
  world = new BIB.World('c');
  world.setGravity([0, 9.8]);
  world.setViewSize([16, 12]);
  world.onEnterFrameActions = onEnterFrameActions;

  var descriptors = {
    animations: [
      {
        name: 'box',
        file: '/images/box.png',
      },
      {
        name: 'small',
        file: '/images/small.png',
        size: [0.8, 0.8],
      },
      {
        name: 'big',
        file: '/images/big.png',
        size: [1.25, 1.25],
      },
      {
        name: 'block',
        file: '/images/block.jpg',
      },
    ],

    // Box2D uses bit masks to specific which objects can collide. Typically
    // each collision category is named in an enum and given a place in the bit
    // mask. In BIB the bits are assigned automatically, so each Fixture just
    // declares a list of named collision categories.
    //
    // By default, every Fixture belongs to the category 'default' and collides
    // with all other categories.
    // |collisionCategories| overrides the categories that the Fixture belongs
    // to.
    // |doesNotCollideWith| removes categories from the set of categories that
    // this Fixture can collide with.
    // |onlyCollidesWith| make the Fixture collide with only the given
    // categories.
    kinds: [
      {
        name: 'ball1',
        animation: 'small',
        fixtures: [
          {
            shapeType: 'circle',
            shapeData: 0.4,
            collisionFilter:
            {
              collisionCategories: ['one'],
              // Collides with all Fixtures unless the other Fixture does not
              // collide with category 'one'.
            },
          },
        ],
      },
      {
        name: 'ball2',
        animation: 'big',
        fixtures: [
          {
            shapeType: 'circle',
            collisionFilter: {
              collisionCategories: ['two'],
              // Collides with 'wall', 'ball1', and 'ball2'.
              onlyCollidesWith: ['default', 'one', 'two'],
              // Note that if 'two' were not in the list above, 'ball2' would
              // not collide with other 'ball2'.
            },
          },
        ],
      },
      {
        name: 'box',
        animation: 'box',
        fixtures: [
          {
            collisionFilter: {
              collisionCategories: ['box'],
              // Collides with everything except 'stirrer'.
              doesNotCollideWith: ['stirrer'],
              // Note that while 'box' is willing to collide with 'ball2',
              // 'ball2' is not willing to collide with 'box'. Therefore the two
              // don't collide.
            },
          },
        ],
      },
      {
        name: 'wall',
        animation: 'block',
        fixtures: [{}],
        // This will have category 'default' and collide with everything.
        movementType: 'static',
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
            collisionFilter: {
              collisionCategories: ['stirrer'],
              // Note that this is kinematic, so it will not collide with other
              // kinematic or static objects (such as the wall), even though
              // they can collide according to their collision categories.
            },
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

  // A box.
  world.newThing('box', { scale: [3, 3] });

  // Some of each Kind of ball.
  for (var i = 0; i < 10; i++) {
    world.newThing('ball1');
    world.newThing('ball2');
  }

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

  world.start();
}

function onEnterFrameActions(world) {
  // Nothing here, have a look at the other samples.
}

window.onload = start;

