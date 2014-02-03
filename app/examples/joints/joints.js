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
        fixtures: [{}],
        movementType: 'static',
      },
      {
        name: 'box',
        animation: 'box',
        fixtures: [{}],
      },
    ],
  };

  world.load(descriptors, onLoadComplete);
}

function onLoadComplete(world) {
  var b2Vec2              = box2d.b2Vec2,
      b2DistanceJointDef  = box2d.b2DistanceJointDef,
      b2GearJointDef      = box2d.b2GearJointDef,
      b2MouseJointDef     = box2d.b2MouseJointDef,
      b2PrismaticJointDef = box2d.b2PrismaticJointDef,
      b2PulleyJointDef    = box2d.b2PulleyJointDef,
      b2RevoluteJointDef  = box2d.b2RevoluteJointDef,
      b2RopeJointDef      = box2d.b2RopeJointDef,
      b2WeldJointDef      = box2d.b2WeldJointDef,
      b2WheelJointDef     = box2d.b2WheelJointDef;

  world.newThing('wall', { position: [0, 6], scale: [16, 1] });

  var t, t2;
  var jd;

  // Joints are used in Box2D to connect or constrain the movement of bodies.
  // BIB currently has no API for this, but it's generally okay to manipulate
  // the Box2D world directly.
  // Joints are created by defining a b2JointDef. The joint types vary in how
  // they are initialized, and what bodies/points they take.
  // See the Box2D manual for more info on joints.

  // Forces two bodies to share a single anchor point. Bodies rotate freely
  // about the anchor.
  jd = new b2RevoluteJointDef();
  t = world.newThing('box', { position: [-7, 0], scale: [1, 3] });
  jd.Initialize(world.groundBody, t.body, t.body.GetWorldCenter());
  world.boxWorld.CreateJoint(jd);

  // Like revolute joint except each body has its own anchor. The anchors are
  // separated by a fixed distance.
  jd = new b2DistanceJointDef();
  t = world.newThing('box', { position: [-5, 0] });
  t2 = world.newThing('box', { position: [-5, 2] });
  jd.Initialize(t.body, t2.body,
                t.body.GetWorldCenter(), t2.body.GetWorldCenter());
  world.boxWorld.CreateJoint(jd);

  // Anchors a body to an axis, it can slide along the axis but cannot rotate.
  jd = new b2PrismaticJointDef();
  t = world.newThing('box', { position: [-3, 0] });
  jd.Initialize(world.groundBody, t.body,
                t.body.GetWorldCenter(),
                new b2Vec2(0, 1));  // The movement axis.
  world.boxWorld.CreateJoint(jd);

  // Like prismatic joint but the body is pushed toward a target point. Used for
  // simulating linear suspension.
  jd = new b2WheelJointDef();
  t = world.newThing('box', { position: [-1, 0] });
  jd.Initialize(world.groundBody, t.body,
                t.body.GetWorldCenter(),
                new b2Vec2(0, 1));
  world.boxWorld.CreateJoint(jd);

  // Forces two bodies to share an anchor point with fixed relative rotation.
  // Note that the bodies are independent so, unlike fixtures in the same body,
  // the joint can deform under load.
  jd = new b2WeldJointDef();
  t = world.newThing('box', { position: [1, 0] });
  t2 = world.newThing('box', { position: [1.5, 0.5] });
  var center = t.body.GetWorldCenter().Clone();
  center.SelfAdd(t2.body.GetWorldCenter());
  center.SelfMul(0.5);
  jd.Initialize(t.body, t2.body, center);
  world.boxWorld.CreateJoint(jd);

  // Limits the distance a body can be from an anchor point. This has no
  // Initialize, so the fields must be set manually.
  jd = new b2RopeJointDef();
  t = world.newThing('box', { position: [0, -5] });
  jd.bodyA = world.groundBody;
  jd.bodyB = t.body;
  // These are points local to each body.
  jd.localAnchorA.SetXY(0, -5);
  jd.localAnchorB.SetXY(0, 0);
  jd.maxLength = 3;  // Must be set, 0 by default.
  world.boxWorld.CreateJoint(jd);

  // Similar to two rope joints where the ropes are joined via a pulley.
  jd = new b2PulleyJointDef();
  t = world.newThing('box', { position: [3, 0] });
  t2 = world.newThing('box', { position: [4, 0] });
  jd.Initialize(t.body, t2.body,
                // The anchor points on the ground body for each rope.
                new b2Vec2(3, -5), new b2Vec2(4, -5),
                // The anchor points (in world coordinates) on each body.
                new b2Vec2(3, 0), new b2Vec2(4, 0),
                // The pulley ratio between the two sides.
                1);
  world.boxWorld.CreateJoint(jd);

  // The gear joint requires two existing revolute or prismatic joints to
  // connect into a gear system.
  jd = new b2RevoluteJointDef();
  t = world.newThing('box', { position: [4, 3], scale: [1, 3] });
  jd.Initialize(world.groundBody, t.body, t.body.GetWorldCenter());
  var revolute = world.boxWorld.CreateJoint(jd);

  jd = new b2PrismaticJointDef();
  t = world.newThing('box', { position: [7, 0] });
  jd.Initialize(world.groundBody, t.body,
                t.body.GetWorldCenter(),
                new b2Vec2(0, 1));
  var prismatic = world.boxWorld.CreateJoint(jd);

  // |bodyA| and |bodyB| need to be set to the secondary bodies of each existing
  // joint.
  jd = new b2GearJointDef();
  jd.joint1 = revolute;
  jd.bodyA = revolute.GetBodyB();
  jd.joint2 = prismatic;
  jd.bodyB = prismatic.GetBodyB();
  jd.ratio = -1;  // 1 by default.
  world.boxWorld.CreateJoint(jd);

  // A mouse joint is a 'soft' revolute joint designed for using the mouse to
  // move bodies. |bodyA| must be the ground body.
  world.allKinds['box'].onPointerDown = function (interaction) {
    var jd = new b2MouseJointDef();
    jd.bodyA = world.groundBody;
    jd.bodyB = interaction.thing.body;
    // |target| determines the initial anchor point on the body.
    jd.target.Copy(interaction.position);
    jd.maxForce = 1000 * jd.bodyB.GetMass();  // Must be set, 0 by default.
    interaction.joint = world.boxWorld.CreateJoint(jd);
  };
  world.allKinds['box'].onPointerMove = function (interaction) {
    // Move the target.
    interaction.joint.SetTarget(interaction.position);
  };
  world.allKinds['box'].onPointerUp = function (interaction) {
    world.boxWorld.DestroyJoint(interaction.joint);
    interaction.joint = null;
  };

  world.start();
}

window.onload = start;

