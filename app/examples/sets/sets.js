'use strict';

var world;

function start() {
  world = new BIB.World('c');
  world.setGravity([0, 10]);
  world.setViewSize([16, 11]);

  var descriptors = {
    loadAnimations: ['animations.json'],
    loadKinds: ['kinds.json'],
    // Sets make it easier to create groups of things, e.g. repeated patterns or
    // laying out levels.
    sets: [
      {
        // |name| is the identifier used in BIB.
        name: 'example',
        // |things| is a list of descriptors for Things to create.
        things: [
          // Each descriptor contains the parameters normally passed to
          // world.newThing.
          { kind: 'no-image', params: { position: [-0.5, -0.5], alpha: 0.5 }},
          { kind: 'no-image', params: { position: [0.5, 0.5] }},
        ],
      },
      {
        name: 'base',
        things: [
          { kind: 'background',
            params: { position: [0, 0], scale: [2.5, 2.5] }},
          { kind: 'wall',
            params: { position: [-1, 6], scale: [19, 1] }},
          { kind: 'wall',
            params: { position: [-1, -6], scale: [19, 1] }},
          { kind: 'wall',
            params: { position: [9, 0], scale: [1, 12] }},
          { kind: 'wall',
            params: { position: [-10, 0], scale: [1, 12] }},
        ],
      },
    ],
    // Sets can be loaded from json.
    loadSets: ['level1.json', 'level2.json', 'level3.json'],
  }

  world.load(descriptors, onLoadComplete);
}

function onLoadComplete(world) {
  var	b2Vec2		      = box2d.b2Vec2;

  // |world.allSets| is a dictionary mapping name to the array of descriptors.

  // Center
  // Create a Set of Things using newThingsFromSet.
  world.newThingsFromSet(world.allSets['example']);

  // Top
  // The Set does not need to be predefined.
  world.newThingsFromSet([
    { kind: 'no-image', params: { position: [0, -2] } },
    { kind: 'no-image', params: { position: [0, -3] } },
    { kind: 'no-image', params: { position: [0, -4] } },
  ]);

  // Top right
  // newThingsFromSet can take params which will be applied in addition to the
  // params specified in the Set. This can be considered params for the Set as
  // a whole.
  world.newThingsFromSet(world.allSets['example'], { position: [3, -2] });

  // Bottom left
  // Scaling the whole Set.
  world.newThingsFromSet(world.allSets['example'],
                         { position: [-3, 2], scale: [1.5, 1.5] });

  // Top left
  // Scaling and rotating the whole Set.
  world.newThingsFromSet(world.allSets['example'], {
    position: [-3, -2],
    scale: [0.7, 1.2],
    angle: 0.7,
  });

  // Bottom right
  // Alpha is multiplied.
  world.newThingsFromSet(world.allSets['example'],
                         { position: [2.5, 0.5], alpha: 2 });
  world.newThingsFromSet(world.allSets['example'],
                         { position: [1.5, 1.5], alpha: 0.5 });

  // Very bottom right
  // Additional depth makes this Set appear behind the one above.
  world.newThingsFromSet(world.allSets['example'],
                         { position: [3, 3], angle: Math.PI, depth: 1 });


  world.start();

  // Set the level when these buttons are clicked.
  document.getElementById('level1').onclick = function () {
    setLevel('level1');
  };
  document.getElementById('level2').onclick = function () {
    setLevel('level2');
  };
  document.getElementById('level3').onclick = function () {
    setLevel('level3');
  };

  // Shoot from the bottom left.
  document.getElementById('fire').onclick = function () {
    world.newThing('chicken', { position: [-9, 5], velocity: [10, -10], });
  };
}

function destroyAll() {
  for (var k in world.allKinds) {
    var kind = world.allKinds[k];
    kind.forEachThing(function (thing) {
      thing.destroy();
    });
  }
}

function setLevel(level) {
  // Destroy all Things.
  destroyAll();

  // Create the base level layout.
  world.newThingsFromSet(world.allSets['base']);

  // Add Things for this level.
  // Set origin somewhere to the bottom right.
  world.newThingsFromSet(world.allSets[level], { position: [7, 5] });
}

window.onload = start;
