
BIB.getDefaultParams = function (inputParams) {
  var	b2Vec2		      = box2d.b2Vec2;

  var build = BIB.arrayTob2Vec2;

  var p = inputParams || {};

  return {
    position: build(p.position) || new b2Vec2(0, 0),
    angle: (typeof p.angle == 'number') ? p.angle : 0,
    scale: build(p.scale) || new b2Vec2(1, 1),
    depth: (typeof p.depth == 'number') ? p.depth : 0,
    velocity: build(p.velocity) || new b2Vec2(0, 0),
    animation: p.animation,
    alpha: (typeof p.alpha == 'number') ? p.alpha : 1,
  };
};

BIB.World.prototype.getLayer = function (depth) {
  var childIndex = this.numLayers - depth;
  if (childIndex >= 0 && childIndex <= this.numLayers * 2) {
    return this.stage.getChildAt(childIndex);
  }
  console.error('Invalid depth: ' + depth);
  return null;
};

BIB.buildSkeleton = function (body) {
  var skeleton = new Sprite();
  skeleton.graphics.lineStyle(0.02);  // Thickness in IvanK.
  for (var f = body.GetFixtureList(); f; f = f.GetNext()) {
    var shape = f.GetShape();
    if (shape.m_vertices) {
      var vertex = shape.m_vertices[shape.m_count - 1];
      skeleton.graphics.moveTo(vertex.x, vertex.y);
      for (var v = 0; v < shape.m_count; v++) {
        var vertex = shape.m_vertices[v];
        skeleton.graphics.lineTo(vertex.x, vertex.y);
      }
    } else {
      var r = shape.m_radius;
      var c = r * 0.55;
      skeleton.graphics.moveTo(r, 0);
      skeleton.graphics.cubicCurveTo(r, c, c, r, 0, r);
      skeleton.graphics.cubicCurveTo(-c, r, -r, c,  -r, 0);
      skeleton.graphics.cubicCurveTo(-r, -c, -c, -r,  0, -r);
      skeleton.graphics.cubicCurveTo(c, -r, r, -c,  r, 0);
    }
  }
  return skeleton;
};

/**
 * Takes a dict of initial parameters:
 *   position: in meters {x, y}
 *   angle: in radians (like Box2D)
 *   scale: factor {x, y}
 *   velocity: {x, y}
 */
BIB.World.prototype.newThing = function (kindName, initialParams) {
  var p = BIB.getDefaultParams(initialParams);
  var k = this.allKinds[kindName];

  k.bodyDef.position.Copy(p.position);
  k.bodyDef.angle = p.angle;
  k.bodyDef.linearVelocity.Copy(p.velocity);

  var body = this.boxWorld.CreateBody(k.bodyDef);

  k.fixtures.forEach(function (fixture) {
    fixture.fixDef.shape =
        BIB.buildShape(fixture.shapeType, fixture.shapeData, p.scale);
    body.CreateFixture(fixture.fixDef);
  });

  var actor = new AnimatedBitmap(k.animationOffset);
  actor.scaleX = p.scale.x;
  actor.scaleY = p.scale.y;
  var animationName = p.animation || k.animation;
  if (animationName) {
    var animation = this.allAnimations[animationName];
    actor.setAnimation(animation);
  }
  actor.alpha *= p.alpha;
  this.getLayer(p.depth).addChild(actor);

  var skeleton = BIB.buildSkeleton(body);
  this.skeletonLayer.addChild(skeleton);

  var index = k.nextThingIndex;
  var t = new BIB.Thing(k, index, body, actor, p.depth, animationName,
                        skeleton);
  body.SetUserData(t);
  actor.thing = t;
  k.things[index] = t;
  k.nextThingIndex++;
  return t;
};

BIB.World.prototype.newThingsFromSet = function (thingSet, setParams) {
  var b2Mat22              = box2d.b2Mat22,
      b2MulMV              = box2d.b2MulMV;

  var setParams = BIB.getDefaultParams(setParams);
  var rotation = b2Mat22.FromAngleRadians(setParams.angle);

  thingSet.forEach(function (descriptor) {
    var params = BIB.getDefaultParams(descriptor.params);
    params.position.x *= setParams.scale.x;
    params.position.y *= setParams.scale.y;
    b2MulMV(rotation, params.position, params.position);
    params.position.SelfAdd(setParams.position);

    params.angle += setParams.angle;
    params.scale.x *= setParams.scale.x;
    params.scale.y *= setParams.scale.y;
    params.depth += setParams.depth;
    params.velocity.SelfAdd(setParams.velocity);
    params.animation = setParams.animation;
    params.alpha *= setParams.alpha;
    this.newThing(descriptor.kind, params);
  }, this);
};

BIB.Thing = function (kind, index, body, actor, depth, animationName,
                      skeleton) {
  // The Kind that this Thing is an instance of.
  this.kind = kind;
  // This Things index in kind.things. Volatile, read-only.
  this.index = index;
  // The b2Body used for simulation.
  this.body = body;
  // The IvanK actor that renders the sprite.
  this.actor = actor;
  // The layer (z-depth) of this Thing. Read-only.
  this.depth = depth;
  // The current animation. Set using setAnimation().
  this.animation = animationName;
  // Whether this Thing has been destroyed.
  this.destroyed = false;
  // This object's skeleton Sprite.
  this.skeleton = skeleton;
};

BIB.Thing.prototype.setAnimation = function (animationName) {
  if (animationName == this.animation) {
    return;
  }

  if (!animationName) {
    this.animation = '';
    this.actor.setAnimation(null);
    return;
  }

  this.animation = animationName;
  var world = this.kind.world;
  var animation = world.allAnimations[animationName];
  this.actor.setAnimation(animation);
}

BIB.Thing.prototype.destroy = function () {
  var world = this.kind.world;
  if (!this.destroyed) {
    this.destroyed = true;

    // Remove actor.
    var layer = world.getLayer(this.depth);
    layer.removeChild(this.actor);
    this.actor.thing = null;
    this.actor = null;

    // Remove skeleton.
    world.skeletonLayer.removeChild(this.skeleton);
    this.skeleton = null;

    // Remove body.
    world.boxWorld.DestroyBody(this.body);
    this.body.SetUserData(null);
    this.body = null;

    // Move last thing into this index;
    var lastIndex = this.kind.nextThingIndex - 1;
    var lastThing = this.kind.things[lastIndex];
    this.kind.things[this.index] = lastThing;
    lastThing.index = this.index;
    this.kind.things[lastIndex] = null;
    this.kind.nextThingIndex--;
    this.index = undefined;
  }
};
