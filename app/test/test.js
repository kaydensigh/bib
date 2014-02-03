'use strict';

// BIB world.
var w1;

function createMouseJoint(world, position, body) {
  var	b2MouseJointDef = box2d.b2MouseJointDef;

  var md = new b2MouseJointDef();
  md.bodyA = world.groundBody;
  md.bodyB = body;
  md.target.Copy(position);
  md.collideConnected = true;
  md.maxForce = 10000 * body.GetMass();
  var mouseJoint = world.boxWorld.CreateJoint(md);
  body.SetAwake(true);
  return mouseJoint;
}

function grabThingDown(interaction) {
  interaction.joint = createMouseJoint(
      interaction.world, interaction.position, interaction.thing.body);
}

function grabThingMove(interaction) {
  interaction.joint.SetTarget(interaction.position.Clone());
}

function grabThingUp(interaction) {
  interaction.world.boxWorld.DestroyJoint(interaction.joint);
  interaction.joint = null;
}

function panViewDown(interaction) {
  interaction.panViewDownPosition =
    interaction.thing ? null : interaction.position.Clone();
}

function panViewMove(interaction) {
  if (interaction.panViewDownPosition) {
    var viewPosition = interaction.world.viewPosition.Clone();
    viewPosition.SelfSub(interaction.world.mousePosition);
    viewPosition.SelfAdd(interaction.panViewDownPosition);
    interaction.world.setViewPosition(viewPosition);
  }
}

function panViewUp(interaction) {
  interaction.panViewDownPosition = null;
}

function onEnterFrameActions(world) {
  // check velocity
  var now = Date.now();
  world.allKinds['force'].forEachThing(function (thing) {
    if (now - thing.creationTime > 200) {
      thing.destroy();
    }
  });
}

function makeBalls(world, kind) {
  var t;
  for (var i = -10; i <= 10; i++) {
    for (var j = -5; j <= 5; j++) {
      t = world.newThing(kind, {
        position: [0.7*i, 0.7*j],
        scale: [0.6, 0.6],
      });
      t.actor.setInstant(Math.random());
      t.actor.onAnimationFinished = AnimatedBitmap.LOOP;
    }
  }
}

function makeWalls(world, kind) {
  var w = 20 / 2;
  var h = 15 / 2;
  world.newThing(kind, {position: [-w, 0], scale: [1, 2*h]}); // left
  world.newThing(kind, {position: [w, 0], scale: [1, 2*h]}); // right
  world.newThing(kind, {position: [0, h], scale: [2*w+1, 1]}); // floor
  world.newThing(kind, {position: [0, -h], scale: [2*w, 1]}); // ceiling
  world.newThing(kind,
      {position: [-0.8*w, 0.8*h], scale: [1, h], angle: -0.8}); // left corner
  world.newThing(kind,
      {position: [0.8*w, 0.8*h], scale: [1, h], angle: 0.8}); // right corner
}

function moveOne(world, x, y) {
  var	b2Vec2		      = box2d.b2Vec2;

  world.allKinds['small'].things[0].body.SetPosition(new b2Vec2(x, y));
}

function bump(thingA, thingB) {
  var	b2Vec2		      = box2d.b2Vec2;

  if (thingB.destroyed) {
    return;
  }

  var centerA = thingA.body.GetWorldCenter();
  var centerB = thingB.body.GetWorldCenter();
  thingA.body.GetLinearVelocity().y = -10;
  thingB.destroy();
  var t;
  var now = Date.now();
  var velocities = [
    new b2Vec2(-20, 5),
    new b2Vec2(20, 5),
    new b2Vec2(5, 20),
    new b2Vec2(-5, 20),
  ]
  for (var v in velocities) {
    t = thingA.kind.world.newThing('force', {
      position: centerB,
      scale: new b2Vec2(0.5, 0.5),
      velocity: velocities[v],
    });
    t.creationTime = now;
  }
}

function start() {
  var	b2Vec2		      = box2d.b2Vec2;

  // Set the canvas' parent div size.
  var resize = function () {
    var div = document.getElementById('canvasdiv');
    div.style.width = window.innerWidth + 'px';
    div.style.height = window.innerHeight + 'px';
  };
  resize();
  window.addEventListener('resize', resize);

  w1 = new BIB.World('c');
  w1.setGravity([0, 10]);
  w1.setViewSize([20, 15]);
  w1.onEnterFrameActions = onEnterFrameActions;

  w1.load({
    loadAnimations: ['animations.json'],
    loadKinds: ['kinds.json', 'kinds2.json'],
    loadSets: ['set.json'],
  }, onLoadComplete);
}

function buildLevel(world) {
  var	b2Vec2		      = box2d.b2Vec2;

  var t = world.newThing('box', {position: new b2Vec2(0, 4), scale: [4, 4]});
  t.body.SetAngleRadians(1);

  makeBalls(world, 'ball');
  makeWalls(world, 'wall');

  world.newThingsFromSet(world.allSets['smalls'], [0, 0]);

  var t = world.allKinds['small'].things[1];

  world.newThing('bigball', {velocity: new b2Vec2(5, -5)});

  world.newThing('background', {depth: 1});

  world.allKinds['small'].beginContactActions['ball'] = bump;
}

function addDragHandler(kind) {
  kind.onPointerDown = grabThingDown;
  kind.onPointerMove = grabThingMove;
  kind.onPointerUp = grabThingUp;
}

function onLoadComplete(world, loadedItems) {
  buildLevel(world);
  addDragHandler(world.allKinds['ball']);
  world.onPointerDown = panViewDown;
  world.onPointerMove = panViewMove;
  world.onPointerUp = panViewUp;
  world.start();
}

window.onload = start;

