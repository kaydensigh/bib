'use strict';

// BIB world.
var world;

function start() {
  world = new BIB.World('c');
  world.setGravity([0, 9.8]);
  world.setViewSize([16, 12]);

  var descriptors = {
    loadAnimations: ['animations.json'],
    kinds: [
      {
        name: 'ball1',
        animation: 'ball1',
        fixtures: [
          {
            shapeType: 'circle',
          },
        ],
      },
      {
        name: 'ball2',
        animation: 'ball2',
        fixtures: [
          {
            shapeType: 'circle',
          },
        ],
      },
      {
        name: 'marker',
        animation: 'box',
        movementType: 'static',
      },
      {
        name: 'wall',
        fixtures: [{}],
        movementType: 'static',
      },
    ],
  };

  world.load(descriptors, onLoadComplete);
}

function onLoadComplete(world) {
  var t;

  // Walls around the outside.
  var w = world.viewSize.x + 1;
  var h = world.viewSize.y + 1;
  world.newThing('wall', { position: [-w/2, 0], scale: [1, h] });
  world.newThing('wall', { position: [w/2, 0], scale: [1, h] });
  world.newThing('wall', { position: [0, -h/2], scale: [w, 1] });
  world.newThing('wall', { position: [0, h/2], scale: [w, 1] });

  // A few balls.
  world.newThing('ball1');
  world.newThing('ball1');
  world.newThing('ball1');
  world.newThing('ball2');
  world.newThing('ball2');
  world.newThing('ball2');

  // BIB provides support for one form of interaction: click and drag. This is
  // essentially the interaction that can be performed with either a mouse or a
  // touch screen.
  // |onPointerDown/Move/Up| are fired every time a mouse click or touch point
  // starts, moves, or is released. For mouse events, |onPointerMove| is only
  // fired while the left button is pressed.

  world.onPointerDown = createMarker;
  world.onPointerMove = updateMarker;
  world.onPointerUp = destroyMarkerAndShoot;

  // Each Kind can also have pointer interaction handlers. If the Kind has an
  // |onPointerDown| defined, and the initial |onPointerDown| overlaps a Thing,
  // the event handlers for that Kind will also be called for the duration of
  // that interaction.
  world.allKinds['ball1'].onPointerDown = function () {};
  world.allKinds['ball1'].onPointerMove = moveThing;

  world.allKinds['ball2'].onPointerDown = destroyOnClick;

  // When the world.stop() is called, any ongoing interactions will end and
  // |onPointerDown| will be fired.
  document.getElementById('start').onclick = function () { world.start(); };
  document.getElementById('stop').onclick = function () { world.stop(); };

  world.start();
}

// The pointer interaction handlers are called with an |interaction| object.
// Each interaction represents one down-move-up cycle. It has number of fields:
// |id| as an identifier for this interaction.
// |world| is the BIB World.
// |mouseEvent| is the mouse event, or null for touch events.
// |touchEvent| is the touch event, or null for mouse events.
// |touch| is the specific touch that this interaction corresponds to (a touch
// event may involve multiple touches).
// |position| the current BIB position of this interaction.
// |thing| the Thing that onPointerDown overlapped with, or null if none.

function createMarker(interaction) {
  if (interaction.thing) {
    // Do nothing if pointer clicked on a Thing.
    return;
  }
  // |onPointerDown| on empty space, create a marker.
  markers[interaction.id] = new Marker(interaction.position);
}

function updateMarker(interaction) {
  if (interaction.thing) {
    return;
  }
  // |onPointerMove| update the marker with the current pointer position.
  markers[interaction.id].updateDelta(interaction.position);
}

function destroyMarkerAndShoot(interaction) {
  if (interaction.thing) {
    return;
  }
  // |onPointerUp| create a new 'ball2' and set its velocity based on the
  // direction and size of the marker. Then destroy the marker.
  var marker = markers[interaction.id];
  world.newThing('ball2', {
    position: marker.position,
    velocity: [10 * marker.delta.x, 10 * marker.delta.y],
  });
  marker.thing.destroy();
  delete markers[interaction.id];
}

// Marker records the initial position of the pointer and the current position.
function Marker(position) {
  var b2Vec2          = box2d.b2Vec2;

  this.thing = world.newThing('marker', {
    position: position,
    scale: [0.2, 0.2],
  });
  this.position = position.Clone();
  this.delta = new b2Vec2();
};

// It updates the scale and angle of the 'marker' Thing in BIB.
Marker.prototype.updateDelta = function (position) {
  this.delta = position.Clone();
  this.delta.SelfSub(this.position);
  this.thing.actor.scaleX = this.delta.GetLength();
  this.thing.body.SetAngleRadians(Math.atan2(this.delta.y, this.delta.x));
}

// Map of interactions to Markers.
var markers = {};

// Move the Thing toward the pointer.
function moveThing(interaction) {
  var direction = interaction.position.Clone();
  direction.SelfSub(interaction.thing.body.GetPosition());
  direction.SelfMul(5);
  interaction.thing.body.SetLinearVelocity(direction);
  interaction.thing.body.SetAwake(true);
}

// Destroy the thing.
function destroyOnClick(interaction) {
  interaction.thing.destroy();
}

window.onload = start;

