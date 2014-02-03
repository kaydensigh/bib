
BIB.World.prototype.updateMousePosition = function (e) {
  var b2Vec2          = box2d.b2Vec2;

  this.mousePosition = new b2Vec2(e.offsetX, e.offsetY);
  this.mousePosition.SelfSub(this.viewOffset);
  this.mousePosition.SelfMul(1 / this.pixelsPerMeter);
};

BIB.PointerInteraction = function (id, world) {
  this.id = id;
  this.world = world;
  this.mouseEvent = null;
  this.touchEvent = null;
  this.touch = null;
  this.position = null;
  this.thing = null;
};

BIB.World.prototype.doOnPointerDown = function (interaction) {
  var thing = this.getThingAtPosition(interaction.position);
  if (thing) {
    interaction.thing = thing;
  }
  this.onPointerDown(interaction);
  if (thing && thing.kind.onPointerDown) {
    thing.kind.onPointerDown(interaction);
  }
};

BIB.World.prototype.doOnPointerMove = function (interaction) {
  this.onPointerMove(interaction);
  if (interaction.thing && interaction.thing.kind.onPointerMove) {
    interaction.thing.kind.onPointerMove(interaction);
  }
};

BIB.World.prototype.doOnPointerUp = function (interaction) {
  this.onPointerUp(interaction);
  if (interaction.thing) {
    if (interaction.thing.kind.onPointerUp) {
      interaction.thing.kind.onPointerUp(interaction);
    }
    interaction.thing = null;
  }
};

// Interaction id for the mouse pointer interaction.
BIB.mouseInteractionId = 0;

BIB.World.prototype.onMouseDown = function (e) {
  if (e.button !== 0) {
    return;
  }

  this.updateMousePosition(e);
  var interaction = new BIB.PointerInteraction(BIB.mouseInteractionId, this);
  this.pointerInteractions[BIB.mouseInteractionId] = interaction;
  interaction.mouseEvent = e;
  interaction.position = this.mousePosition;
  this.doOnPointerDown(interaction);
};

BIB.World.prototype.onMouseMove = function (e) {
  var interaction = this.pointerInteractions[BIB.mouseInteractionId];
  if (!interaction) {
    return;
  }

  if (e.which === 0) {
    // An interaction exists but e.which is 0, so we must have missed the
    // mouseUp.
    this.onMouseUp(e);
    return;
  }

  this.updateMousePosition(e);
  interaction.mouseEvent = e;
  interaction.position = this.mousePosition;
  this.doOnPointerMove(interaction);
};

BIB.World.prototype.onMouseUp = function (e) {
  var interaction = this.pointerInteractions[BIB.mouseInteractionId];
  if (e.button !== 0 || !interaction) {
    return;
  }

  interaction.mouseEvent = e;
  interaction.position = this.mousePosition;
  this.doOnPointerUp(interaction);
  delete this.pointerInteractions[BIB.mouseInteractionId];
};

BIB.World.prototype.getTouchPosition = function (touch) {
  var rect = touch.target.getBoundingClientRect();
  return this.pixelsToPosition(touch.pageX - rect.left, touch.pageY - rect.top);
};

BIB.World.prototype.onTouchStart = function (e) {
  e.preventDefault();
  var touches = e.changedTouches;

  for (var t = 0; t < touches.length; t++) {
    var touch = touches[t];
    var interaction = new BIB.PointerInteraction(touch.identifier, this);
    this.pointerInteractions[touch.identifier] = interaction;
    interaction.touchEvent = e;
    interaction.touch = touch;
    interaction.position = this.getTouchPosition(touch);
    this.doOnPointerDown(interaction);
  }
};

BIB.World.prototype.onTouchMove = function (e) {
  e.preventDefault();
  var touches = e.changedTouches;

  for (var t = 0; t < touches.length; t++) {
    var touch = touches[t];
    var interaction = this.pointerInteractions[touch.identifier];
    if (!interaction) {
      continue;
    }
    interaction.touchEvent = e;
    interaction.touch = touch;
    interaction.position = this.getTouchPosition(touch);
    this.doOnPointerMove(interaction);
  }
};

BIB.World.prototype.onTouchEnd = function (e) {
  e.preventDefault();
  var touches = e.changedTouches;

  for (var t = 0; t < touches.length; t++) {
    var touch = touches[t];
    var interaction = this.pointerInteractions[touch.identifier];
    if (!interaction) {
      continue;
    }
    interaction.touchEvent = e;
    interaction.touch = touch;
    interaction.position = this.getTouchPosition(touch);
    this.doOnPointerUp(interaction);
    delete this.pointerInteractions[touch.identifier];
  }
};

BIB.World.prototype.getThingAtPosition = function (position) {
  var b2Vec2          = box2d.b2Vec2,
      b2AABB          = box2d.b2AABB;

  var aabb = new b2AABB();
  var delta = new b2Vec2(0.001, 0.001);
  aabb.lowerBound.Copy(position);
  aabb.lowerBound.SelfSub(delta);
  aabb.upperBound.Copy(position);
  aabb.upperBound.SelfAdd(delta);

  var thing = null;
  // Query the boxWorld for overlapping shapes.
  var that = this;
  var getThingCallback = function (fixture) {
    return that.getThingCallback(fixture, position,
                                 function (foundThing) { thing = foundThing; });
  };
  this.boxWorld.QueryAABB(getThingCallback, aabb);
  return thing;
};

BIB.World.prototype.getThingCallback = function (fixture, position, callback) {
  var b2Body		      = box2d.b2Body;

  var body = fixture.GetBody();
  var thing = body.GetUserData();
  if (thing.kind.onPointerDown) {
     if (fixture.GetShape().TestPoint(body.GetTransform(), position)) {
       callback(thing);
       return false;
     }
  }
  return true;
};
