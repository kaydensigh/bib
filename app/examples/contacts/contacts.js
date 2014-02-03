'use strict';

// BIB world.
var world;

function start() {
  world = new BIB.World('c');
  world.setViewSize([16, 12]);
  world.onEnterFrameActions = onEnterFrameActions;

  var descriptors = {
    animations: [
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
        name: 'wall',
        animation: 'block',
        fixtures: [
          {
            collisionFilter: {
              collisionCategories: ['wall'],
            },
          },
        ],
        movementType: 'static',
      },
      {
        name: 'box',
        animation: 'block',
        fixtures: [{}],
      },
      {
        name: 'sensor',
        animation: 'box',
        fixtures: [
          // A sensor fixture detects collisions (as per its collision filter)
          // but does not react or generate a reaction in the other body.
          {
            properties: {
              isSensor: true,
            },
          },
          // This second fixture is here so that this body will collide with
          // walls.
          {
            properties: {
              restitution: 1,
              friction: 1,
            },
            collisionFilter: {
              onlyCollidesWith: ['wall'],
            },
          },
        ],
      },
    ],
  };

  world.load(descriptors, onLoadComplete);
}

function onLoadComplete(world) {
  // Walls around the outside.
  var w = world.viewSize.x;
  var h = world.viewSize.y;
  world.newThing('wall', { position: [-w/2, 0], scale: [1, h] });
  world.newThing('wall', { position: [w/2, 0], scale: [1, h] });
  world.newThing('wall', { position: [0, -h/2], scale: [w, 1] });
  world.newThing('wall', { position: [0, h/2], scale: [w, 1] });

  // Field of boxes.
  for (var x = -7; x <= 7; x += 2) {
    for (var y = -5; y <= 5; y += 2) {
      world.newThing('box', { position: [x, y] });
    }
  }

  var t;
  t = world.newThing('sensor', {
    position: [-4, 0],
    scale: [5, 5],
    velocity: [1, 1],
  });
  t.actor.alpha = 0.2;
  t = world.newThing('sensor', {
    position: [3, 1],
    scale: [5, 5],
    velocity: [-1, -1],
  });
  t.actor.alpha = 0.2;

  // |beginContactActions| and |endContactActions| are fired when two Things
  // begin and end contacting. They are passed the respective Things in the
  // order specified. I.e.:
  //   world.allKinds[kindA].beginContactActions[kindB] = beginContact;
  // will call:
  //   beginContact(thingA, thingB, thingAfixture, thingBfixture);
  // The callback will be called for each pair of contacting fixtures.
  // The callbacks are actually enqueued during the Box2D step phase, and
  // executed before onEnterFrameActions.
  world.allKinds['box'].beginContactActions['sensor'] = beginContact;
  world.allKinds['sensor'].endContactActions['box'] = endContact;

  world.start();
}

function beginContact(box, sensor, boxFixture, sensorFixture) {
  box.setAnimation('box');
}

function endContact(sensor, box) {
  // It is possible at any time to inspect the list of fixtures in contact with
  // a body.
  var contactList = box.body.GetContactList();
  while (contactList) {
    // Presence in the contact list does not necessarily mean the fixtures are
    // touching.
    if (contactList.contact.IsTouching()) {
      var otherThing = contactList.other.GetUserData();
      if (otherThing.kind.name == 'sensor') {
        return;
      }
    }
    contactList = contactList.next;
  }
  box.setAnimation('block');
};

function onEnterFrameActions(world) {
  // Prevent the sensors from slowing down.
  world.allKinds['sensor'].forEachThing(function (thing) {
    var velocity = thing.body.GetLinearVelocity();
    velocity.SelfNormalize();
    velocity.SelfMul(2);
    thing.body.SetLinearVelocity(velocity);
    thing.body.SetAngularVelocity(0.2);
  });
}

window.onload = start;

