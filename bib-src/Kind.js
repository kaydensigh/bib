
BIB.World.prototype.setKind = function (descriptor) {
  descriptor = JSON.parse(JSON.stringify(descriptor));
  var name = descriptor.name;
  var kind = this.allKinds[name] || new BIB.Kind(this);
  // Update our Kind with all properties supplied in the descriptor.
  for (var field in descriptor) {
    kind[field] = descriptor[field];
  }
  this.allKinds[name] = kind;
  return kind;
};

BIB.Fixture = function (kind, fixture, previousFixture) {
  var	b2Vec2		      = box2d.b2Vec2,
      b2FixtureDef    = box2d.b2FixtureDef;

  this.kind = kind;

  var f = fixture || {};
  var pf = previousFixture || {};

  // The type of shape: 'circle', 'box', 'polygon'.
  var shapeTypes = ['circle', 'box', 'polygon', 'chain', 'loop'];
  this.shapeType = shapeTypes.indexOf(f.shapeType) == -1 ? 'box' : f.shapeType;
  // The data required to define the shapeType.
  //   circle: radius
  //   box: halfWidth | [halfWidth, halfHeight]
  //   polygon|chain|loop: [[x0,y0], [x1,y1], ...]
  this.shapeData = f.shapeData || 0.5;

  var p = f.properties || pf.properties || {};
  // Properties of the b2FixtureDef.
  this.properties = {
    density: (typeof p.density == 'number') ? p.density : 10,
    friction: (typeof p.friction == 'number') ? p.friction : 0.5,
    restitution: (typeof p.restitution == 'number') ? p.restitution : 0.2,
    isSensor: p.isSensor ? true : false,
  };

  var c = f.collisionFilter || pf.collisionFilter || {};
  // Used to generate collisionFilter.
  this.collisionFilter = {
    // List of categories this Kind belongs to. Set to [] for no collisions.
    collisionCategories: c.collisionCategories || ['default'],
    // By default, all Kinds collide with all categories. Explicitly select
    // categories with onlyCollidesWith, or exclude categories with
    // doesNotCollideWith.
    onlyCollidesWith: c.onlyCollidesWith || [],
    doesNotCollideWith: c.doesNotCollideWith || [],
  };

  var fixDef = this.fixDef = new b2FixtureDef();
  fixDef.density = this.properties.density;
  fixDef.friction = this.properties.friction;
  fixDef.restitution = this.properties.restitution;
  fixDef.isSensor = this.properties.isSensor;
  fixDef.filter = this.kind.world.buildCollisionFilter(this.collisionFilter);
};

BIB.Kind = function (world) {
  var	b2Vec2          = box2d.b2Vec2;

  // The BIB.World.
  this.world = world;

  // The name of this Kind.
  this.name;

  // The default animation to use.
  this.animation;
  // Position of the animation relative to the object.
  this.animationOffset = new b2Vec2();

  // A list of fixtures.
  this.fixtures = [];

  // 'dynamic', 'static', or 'kinematic' as per b2Body.type
  this.movementType = 'dynamic';

  // Properties of the b2BodyDef.
  this.linearDamping = 0;
  this.angularDamping = 0.01;
  this.fixedRotation = false;

  // Actions to take when two things collide.
  // Map of the name of the other Kind to a
  // function(thisThing, otherThing, thisFixture, otherFixture).
  this.beginContactActions = {};
  this.endContactActions = {};

  // Action to take upon interaction with mouse or touch.
  // Functions take a BIB.PointerInteraction.
  this.onPointerDown;
  this.onPointerMove;
  this.onPointerUp;

  // PRIVATE

  // b2BodyDef;
  this.bodyDef;
  // List of Things of this Kind.
  this.things;
  // Used to give unique keys to Things.
  this.nextThingIndex;
};

BIB.shapeDataToArray = function (shapeData, scale) {
  var	b2Vec2          = box2d.b2Vec2;

  var array = new Array();
  if (Array.isArray(shapeData)) {
    shapeData.forEach(function (element) {
      var vertex = BIB.arrayTob2Vec2(element);
      if (vertex) {
        array.push(new b2Vec2(vertex.x * scale.x,
                              vertex.y * scale.y));
      }
    });
  }
  return array;
};

BIB.buildShape = function (shapeType, shapeData, scale) {
  var	b2Vec2          = box2d.b2Vec2,
      b2ChainShape    = box2d.b2ChainShape,
      b2PolygonShape  = box2d.b2PolygonShape,
      b2CircleShape   = box2d.b2CircleShape;

  if (shapeType == 'circle') {
    var radius = (typeof shapeData == 'number') ? shapeData : 0.5;
    return new b2CircleShape(radius * scale.x);
  }
  if (shapeType == 'box') {
    var halfWidth = 0.5;
    var halfHeight = 0.5;
    if (shapeData) {
      if (typeof shapeData == 'number') {
        halfWidth = halfHeight = shapeData;
      } else if (shapeData.length == 2) {
        halfWidth = shapeData[0];
        halfHeight = shapeData[1];
      }
    }
    return new b2PolygonShape().SetAsBox(halfWidth * scale.x,
                                         halfHeight * scale.y);
  }
  if (shapeType == 'polygon') {
    return new b2PolygonShape().SetAsArray(
        BIB.shapeDataToArray(shapeData, scale));
  }
  if (shapeType == 'chain' || shapeType == 'loop') {
    var vertices = BIB.shapeDataToArray(shapeData, scale);
    return shapeType == 'loop'
        ? new b2ChainShape().CreateLoop(vertices)
        : new b2ChainShape().CreateChain(vertices);
  }
};

BIB.World.prototype.getOrAddCollisionCategory = function (category) {
  var cc = this.collisionCategories;
  if (cc[category] === undefined) {
    cc[category] = Object.keys(cc).length;
  }
  return cc[category];
};

BIB.World.prototype.buildCollisionFilter = function (params) {
  var b2Filter    = box2d.b2Filter;

  var collisionFilter = new b2Filter();
  collisionFilter.categoryBits = 0x00000000;
  collisionFilter.maskBits = 0xFFFFFFFF;

  var cc = params.collisionCategories;
  for (var c in cc) {
    collisionFilter.categoryBits |= 1 << this.getOrAddCollisionCategory(cc[c]);
  }

  var ocw = params.onlyCollidesWith;
  if (Array.isArray(ocw) && ocw.length > 0) {
    collisionFilter.maskBits = 0;
    for (var c in ocw) {
      collisionFilter.maskBits |=
          1 << this.getOrAddCollisionCategory(ocw[c]);
    }
  }

  var dncw = params.doesNotCollideWith;
  for (var c in dncw) {
    collisionFilter.maskBits &= ~(1 << this.getOrAddCollisionCategory(dncw[c]));
  }
  return collisionFilter;
};

BIB.Kind.prototype.initialize = function () {
  var	b2Vec2          = box2d.b2Vec2,
      b2Body          = box2d.b2Body,
      b2BodyType      = box2d.b2BodyType,
      b2BodyDef       = box2d.b2BodyDef;

  // Contains all Things of this Kind.
  this.things = this.things || [];
  this.nextThingIndex = this.nextThingIndex || 0;

  this.animationOffset = BIB.arrayTob2Vec2(this.animationOffset);

  for (var f = 0; f < this.fixtures.length; f++) {
    var fixture = this.fixtures[f];
    this.fixtures[f] = new BIB.Fixture(this, fixture, this.fixtures[f - 1]);
  }

  var bodyDef = this.bodyDef = new b2BodyDef();
  bodyDef.type = b2BodyType.b2_dynamicBody;
  if (this.movementType == 'kinematic') {
    bodyDef.type = b2BodyType.b2_kinematicBody;
  } else if (this.movementType == 'static') {
    bodyDef.type = b2BodyType.b2_staticBody;
  }
  bodyDef.linearDamping = this.linearDamping;
  bodyDef.angularDamping = this.angularDamping;
  bodyDef.fixedRotation = this.fixedRotation;
};

BIB.Kind.prototype.forEachThing = function (callback) {
  var t = 0;
  while (t < this.nextThingIndex) {
    var thing = this.things[t];
    callback(thing);
    if (this.things[t] == thing) {
      t++;
    }
  }
};
