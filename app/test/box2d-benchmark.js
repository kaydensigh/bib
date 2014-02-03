'use strict';

// BIB world.
var world;

var time = Date.now();

function onEnterFrameActions(world) {
  var now = Date.now();
  console.log(now - time);
  time = now;

  var now = Date.now();
  world.allKinds['force'].forEachThing(function (thing) {
    if (now - thing.creationTime > 200) {
      thing.destroy();
    }
  });
}

function makeSome(world, kind, offsetX, offsetY) {
  for (var i = -15; i <= 13.5; i += 1.5) {
    for (var j = -9; j <= 7.5; j += 1.5) {
      world.newThing(kind, {
        position: [i + offsetX, j + offsetY],
        scale: [0.5, 0.5],
      });
    }
  }
}

function makeWalls(world, kind) {
  var w = world.viewSize.x * 0.5;
  var h = world.viewSize.y * 0.5;
  world.newThing(kind, { position: [-w, 0], scale: [1, 2*h] }); // left
  world.newThing(kind, { position: [w, 0], scale: [1, 2*h] }); // right
  world.newThing(kind, { position: [0, h], scale: [2*w+1, 1] }); // floor
  world.newThing(kind, { position: [0, -h], scale: [2*w, 1] }); // ceiling
  world.newThing(kind,
      { position: [-0.8*w, 0.8*h], scale: [1, h], angle: -0.8 }); // left corner
  world.newThing(kind,
      { position: [0.8*w, 0.8*h], scale: [1, h], angle: 0.8 }); // right corner
}

function bump(thingA, thingB) {
  var center = thingA.body.GetWorldCenter().Clone();
  center.SelfAdd(thingB.body.GetWorldCenter());
  center.SelfMul(0.5);
  var t;
  var now = Date.now();

  for (var x = -1; x <= 1; x += 2) {
    for (var y = -1; y <= 1; y += 2) {
      t = world.newThing('force', {
        position: center,
        velocity: [x * 10, y * 10],
        scale: [0.5, 0.5],
      });
      t.creationTime = now;
    }
  }
}

function start() {
  world = new BIB.World('c');
  world.setGravity([0, 10]);
  world.setViewSize([40, 30]);
  world.onEnterFrameActions = onEnterFrameActions;

  var descriptors = {
    animations: [
      {
        name: 'box',
        file: '/images/box.png',
      },
      {
        name: 'ball',
        file: '/images/big.png',
        size: [2, 2],
      },
      {
        name: 'complex',
        file: '/images/ham.png',
        size: [2, 2],
      },
    ],
    kinds: [
      {
        name: 'wall',
        animation: 'box',
        fixtures: [{}],
        movementType: 'static',
      },
      {
        name: 'force',
        animation: 'box',
        fixtures: [{}],
      },
      {
        name: 'ball',
        animation: 'ball',
        fixtures: [
          {
            shapeType: 'circle',
            shapeData: 1,
          },
        ],
      },
      {
        name: 'complex',
        animation: 'complex',
        fixtures: [
          {
            shapeType: 'polygon',
            shapeData: [
              [-1, -1],
              [0.5, -1.5],
              [1.5, -0.5],
              [1.5, 0.5],
              [0.5, 1.5],
              [-1, 1],
            ],
          },
        ],
      },
    ],
  };

  world.load(descriptors, onLoadComplete);
}

function onLoadComplete(world) {
  makeWalls(world, 'wall');
  makeSome(world, 'ball', 0, 0);
  makeSome(world, 'complex', 1, 1);
  world.allKinds['ball'].beginContactActions['complex'] = bump;
  world.start();
}

window.onload = start;

