'use strict';

// BIB world.
var world;

function start() {
  world = new BIB.World('c');
  world.setViewSize([12, 9]);

  var descriptors = {
    animations: [
      {
        name: 'grid',
        file: '/images/color-grid.png',
        size: [1.2, 6.4],
        blendMode: 'add',
      },
      {
        name: 'forest',
        file: '/images/forest.jpg',
        size: [4.29, 2.85],
        // Default |blendMode| is 'normal'.
      }
    ],
    kinds: [
      {
        name: 'grid',
        animation: 'grid',
        movementType: 'static',
      },
      {
        name: 'background',
        animation: 'forest',
        movementType: 'static',
      },
    ],
  };

  world.load(descriptors, onLoadComplete);
}

function onLoadComplete(world) {
  var t;

  world.newThing('background', { scale: [4, 4] });

  t = world.newThing('grid', { position: [-4.5, 0] });
  t.actor.blendMode = 'normal';

  world.newThing('grid', { position: [-3, 0] });  // 'add', as set above.
  t = world.newThing('grid', { position: [-1.5, 0] });
  t.actor.blendMode = 'subtract';

  t = world.newThing('grid', { position: [-0, 0] });
  t.actor.blendMode = 'multiply';
  t = world.newThing('grid', { position: [1.5, 0] });
  t.actor.blendMode = 'screen';

  t = world.newThing('grid', { position: [3, 0] });
  t.actor.blendMode = 'erase';
  t = world.newThing('grid', { position: [4.5, 0] });
  t.actor.blendMode = 'alpha';

  world.start();
}

window.onload = start;

