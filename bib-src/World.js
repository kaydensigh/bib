'use strict';

// namespace BIB
var BIB = {};

BIB.arrayTob2Vec2 = function (array) {
  var	b2Vec2		      = box2d.b2Vec2;

  if (Array.isArray(array) && array.length == 2) {
    return new b2Vec2(array[0], array[1]);
  } else if (array instanceof b2Vec2) {
    return array.Clone();
  }
  return null;
};

/**
 * The main object. Takes ownership (via stage) of the canvas.
 */
BIB.World = function (canvasId) {
  var	b2Vec2		      = box2d.b2Vec2,
      b2World		      = box2d.b2World;

  // Member fields.

  // View.
  this.pixelsPerMeter = 0;
  this.viewSize = null;
  this.viewPosition = null;
  this.viewOffset = null;  // Offset in pixels.

  // Kinds and Sets.
  this.allAnimations = {};
  this.allKinds = {};
  this.allSets = {};

  // Box2D.
  this.boxWorld = null;
  // Used to attach joints to 'nothing'.
  this.groundBody = null;
  // Used to generate collisionFilters, maximum of 32 categories.
  this.collisionCategories = {};
  // Closures executed at start of frame.
  this.collisionEvents = [];

  // IvanK
  this.canvas = null;  // The canvas that we're drawing to.
  this.stage = null;
  // Default layer is 0, plus numLayers on either side [-numLayers, numLayers].
  this.numLayers = 5;
  this.skeletonLayer = null;

  // Mouse / touch.
  this.mousePosition = null;
  this.pointerInteractions = {};
  // User supplied callbacks.
  this.onPointerDown = function (interaction) {};
  this.onPointerMove = function (interaction) {};
  this.onPointerUp = function (interaction) {};

  // Main loop.
  this.onEnterFrameActions;  // Callback provided by client.
  this.pause = false;  // If true, don't step the Box2D world.
  this.started = false;

  // Initialization.
  var that = this;

  // Create Box2D world.
  this.boxWorld = new b2World(new b2Vec2(0, 0));
  this.boxWorld.SetContactListener(new BIB.ContactListener(this));
  this.groundBody = this.boxWorld.CreateBody(new box2d.b2BodyDef());

  // Set initial view parameters.
  this.viewSize = new b2Vec2(15, 10);
  this.viewPosition = new b2Vec2(0, 0);

  // Set clients loop callback.
  this.onEnterFrameActions = function () {};
  this.pause = false;

  this.canvas = document.getElementById(canvasId);
  // Add an event listener to resize the canvas.
  // This needs to be done before creating the Stage as the stage will resize
  // itself based on the canvas.
  this.resizeCanvas();
  window.addEventListener('resize', function () { that.resizeCanvas(); });

  // Create IvanK stage. Required to load images.
  this.stage = new Stage(canvasId);
  for (var i = -this.numLayers; i <= this.numLayers; i++) {
    this.stage.addChild(new DisplayObjectContainer());
  }
  this.skeletonLayer = new DisplayObjectContainer();
  this.skeletonLayer.visible = false;
  this.stage.addChild(this.skeletonLayer);

  // Add an event listener to resize the game scale when the stage changes.
  this.updateView();
  this.stage.addEventListener('resize', function (e) { that.updateView(); });

  // Store the event listener functions so that they can be removed later.
  var that = this;
  this.eventListeners = {
    onMouseDown: function (e) { that.onMouseDown(e); },
    onMouseMove: function (e) { that.onMouseMove(e); },
    onMouseUp: function (e) { that.onMouseUp(e); },
    onTouchStart: function (e) { that.onTouchStart(e); },
    onTouchMove: function (e) { that.onTouchMove(e); },
    onTouchEnd: function (e) { that.onTouchEnd(e); },
    onEnterFrame: function (e) { that.onEnterFrame(e); },
  };
};

BIB.World.prototype.setGravity = function (gravity) {
  var gravityVector = BIB.arrayTob2Vec2(gravity);
  if (gravityVector) {
    this.boxWorld.SetGravity(gravityVector);
  }
};

BIB.World.prototype.resizeCanvas = function () {
  var maxWidth = this.canvas.parentNode.offsetWidth;
  var maxHeight = this.canvas.parentNode.offsetHeight;
  var unitSize = Math.min(maxWidth / this.viewSize.x,
                           maxHeight / this.viewSize.y);
  var targetWidth = unitSize * this.viewSize.x;
  var targetHeight = unitSize * this.viewSize.y;
  // Only adjust if there's more than 1 pixel change. This prevents thrashing
  // when zooming at the same aspect ratio.
  var totalChange = Math.abs(this.canvas.width - targetWidth) +
                    Math.abs(this.canvas.height - targetHeight);
  if (totalChange > 1) {
    this.canvas.width = targetWidth;
    this.canvas.height = targetHeight;
  }
};

BIB.World.prototype.load = function (descriptors, onLoadComplete) {
  var that = this;

  descriptors.animations = descriptors.animations || [];
  descriptors.loadAnimations = descriptors.loadAnimations || [];
  descriptors.kinds = descriptors.kinds || [];
  descriptors.loadKinds = descriptors.loadKinds || [];
  descriptors.sets = descriptors.sets || [];
  descriptors.loadSets = descriptors.loadSets || [];

  var loadData = {
    descriptors: descriptors,
    onLoadComplete: onLoadComplete || function () {},
    // This represents the number of files and images still loading.
    itemsRemaining: 0,
  };

  var increment = function (file) {
    //console.log('Loading ' + file);
    loadData.itemsRemaining++;
  };

  // Callback to decrement |itemsRemaining| and init if it is zero.
  var decrementAndCheck = function (file) {
    //console.log('Loaded ' + file);
    loadData.itemsRemaining--;
    if (!loadData.itemsRemaining) {
      that.initWhenLoadComplete(loadData);
    }
  };

  // Increment to wait for all inline descriptors to be loaded.
  increment('inline descriptors');

  // Start loading animations.
  // Callback for processing an animation.
  var addAnimation = function (animation) {
    increment(animation.file);
    that.allAnimations[animation.name] = new BIB.Animation(animation);
    BIB.getImageData(animation.file, function () {
      decrementAndCheck(animation.file);
    });
  };
  // Load passed in animations.
  BIB.validateAnimationDescriptors(descriptors.animations);
  descriptors.animations.forEach(function (animation) {
    addAnimation(animation);
  });
  // Load animation descriptors from json files.
  descriptors.loadAnimations.forEach(function (file) {
    increment(file);
    BIB.getFileData(
        file,
        function (fileData) {
          var json = fileData.json;
          BIB.validateAnimationDescriptors(json);
          json.forEach(function (element) {
            addAnimation(element);
          });
          decrementAndCheck(fileData.file);
        });
  });

  // Start loading Kinds.
  // Load passed in Kinds.
  BIB.validateKindDescriptors(descriptors.kinds);
  descriptors.kinds.forEach(function (kind) {
    this.setKind(kind);
  }, this);
  // Load Kind descriptors from json files.
  descriptors.loadKinds.forEach(function (file) {
    increment(file);
    BIB.getFileData(
        file,
        function (fileData) {
          var json = fileData.json;
          BIB.validateKindDescriptors(json);
          json.forEach(function (element) {
            that.setKind(element);
          });
          decrementAndCheck(fileData.file);
        });
  });

  // Start loading Sets.
  // Load passed in Sets.
  BIB.validateSetDescriptors(descriptors.sets);
  descriptors.sets.forEach(function (currentSet) {
    this.allSets[currentSet.name] = currentSet.things;
  }, this);
  // Load Sets from json files.
  descriptors.loadSets.forEach(function (file) {
    increment(file);
    BIB.getFileData(
        file,
        function (fileData) {
          var json = fileData.json;
          BIB.validateSetDescriptors(json);
          json.forEach(function (element) {
            that.allSets[element.name] = element.things;
          });
          decrementAndCheck(fileData.file);
        });
  });

  // Decrement the extra one added at the start.
  decrementAndCheck('inline descriptors');
};

BIB.World.prototype.initWhenLoadComplete = function (loadData) {
  // Get all loaded animations.
  var animations = loadData.descriptors.animations;
  loadData.descriptors.loadAnimations.forEach(function (animationsFile) {
    animations = animations.concat(BIB.fileCache[animationsFile].json);
  });

  // Init animations.
  animations.forEach(function (animation) {
    this.allAnimations[animation.name].initialize();
  }, this);

  // Get all loaded Kinds.
  var kinds = loadData.descriptors.kinds;
  loadData.descriptors.loadKinds.forEach(function (kindsFile) {
    kinds = kinds.concat(BIB.fileCache[kindsFile].json);
  });

  // Init Kind objects.
  kinds.forEach(function (kind) {
    this.allKinds[kind.name].initialize();
  }, this);

  // Get all loaded sets.
  var sets = loadData.descriptors.sets;
  loadData.descriptors.loadSets.forEach(function (setsFile) {
    sets = sets.concat(BIB.fileCache[setsFile].json);
  });

  // Call clients onLoadComplete callback.
  var loadedItems = { animations: animations, kinds: kinds, sets: sets };
  loadData.onLoadComplete(this, loadedItems);
};

BIB.World.prototype.unload = function () {
  // Delete every element, but keep original dicts.
  for (var s in this.allSets) {
    delete this.allSets[s];
  }
  for (var k in this.allKinds) {
    this.allKinds[k].forEachThing(function (thing) { thing.destroy(); });
    delete this.allKinds[k];
  }
  for (var a in this.allAnimations) {
    delete this.allAnimations[a];
  }
}

BIB.World.prototype.pixelsToPosition = function (offsetX, offsetY) {
  var b2Vec2          = box2d.b2Vec2;

  var position = new b2Vec2(offsetX, offsetY);
  position.SelfSub(this.viewOffset);
  position.SelfMul(1 / this.pixelsPerMeter);
  return position;
};

BIB.World.prototype.setViewSize = function (viewSize) {
  this.viewSize = BIB.arrayTob2Vec2(viewSize) || this.viewSize;
  this.updateView();
  this.resizeCanvas();
};

BIB.World.prototype.setViewPosition = function (viewPosition) {
  this.viewPosition = BIB.arrayTob2Vec2(viewPosition) || this.viewPosition;
  this.updateView();
};

BIB.World.prototype.updateView = function () {
  var	b2Vec2          = box2d.b2Vec2;

  this.pixelsPerMeter = Math.min(this.stage.stageWidth / this.viewSize.x,
                                 this.stage.stageHeight / this.viewSize.y);

  this.viewOffset = new b2Vec2(
      this.stage.stageWidth * 0.5 - this.viewPosition.x * this.pixelsPerMeter,
      this.stage.stageHeight * 0.5 - this.viewPosition.y * this.pixelsPerMeter);

  var stage = this.stage;
  stage.scaleX = this.pixelsPerMeter;
  stage.scaleY = this.pixelsPerMeter;
  stage.x = this.viewOffset.x;
  stage.y = this.viewOffset.y;
};

BIB.World.prototype.fromView = function (position) {
  var newPosition = position.Clone();
  newPosition.SelfSub(this.viewPosition);
  return newPosition;
};

BIB.ContactListener = function (world) {
  box2d.b2ContactListener.call(this);
  this.world = world;
};
BIB.ContactListener.prototype = new box2d.b2ContactListener();
BIB.ContactListener.prototype.BeginContact = function (contact) {
  var fixtureA = contact.GetFixtureA();
  var fixtureB = contact.GetFixtureB();
  var thingA = fixtureA.GetBody().GetUserData();
  var thingB = fixtureB.GetBody().GetUserData();
  var actionAB = thingA.kind.beginContactActions[thingB.kind.name];
  var actionBA = thingB.kind.beginContactActions[thingA.kind.name];
  if (actionAB) {
    this.world.collisionEvents.push(function () {
      actionAB(thingA, thingB, fixtureA, fixtureB);
    });
  }
  if (actionBA) {
    this.world.collisionEvents.push(function () {
      actionBA(thingB, thingA, fixtureB, fixtureA);
    });
  }
};
BIB.ContactListener.prototype.EndContact = function (contact) {
  var fixtureA = contact.GetFixtureA();
  var fixtureB = contact.GetFixtureB();
  var thingA = fixtureA.GetBody().GetUserData();
  var thingB = fixtureB.GetBody().GetUserData();
  var actionAB = thingA.kind.endContactActions[thingB.kind.name];
  var actionBA = thingB.kind.endContactActions[thingA.kind.name];
  if (actionAB) {
    this.world.collisionEvents.push(function () {
      actionAB(thingA, thingB, fixtureA, fixtureB);
    });
  }
  if (actionBA) {
    this.world.collisionEvents.push(function () {
      actionBA(thingB, thingA, fixtureB, fixtureA);
    });
  }
};
BIB.ContactListener.prototype.PostSolve = function (contact, impulse) {};
BIB.ContactListener.prototype.PreSolve = function (contact, oldManifold) {};


// Start rendering and looping.
BIB.World.prototype.start = function () {
  if (this.started) {
    return;
  }

  // Setup pointer callbacks.
  this.canvas.addEventListener('mousedown', this.eventListeners.onMouseDown);
  // Listen on the window so that a click that starts on the canvas and moves
  // off is handled the same as a touch.
  window.addEventListener('mousemove', this.eventListeners.onMouseMove);
  window.addEventListener('mouseup', this.eventListeners.onMouseUp);
  this.canvas.addEventListener('touchstart', this.eventListeners.onTouchStart);
  this.canvas.addEventListener('touchmove', this.eventListeners.onTouchMove);
  this.canvas.addEventListener('touchend', this.eventListeners.onTouchEnd);

  // Start the loop.
  this.stage.addEventListener(
      Event.ENTER_FRAME, this.eventListeners.onEnterFrame);

  this.started = true;
};

BIB.World.prototype.onEnterFrame = function () {
  if (!this.pause) {
    // Step boxWorld.
    this.boxWorld.Step(1 / 60, 3, 3);

    // Process collisions.
    this.collisionEvents.forEach(function (action) {
      action();
    });
    this.collisionEvents = [];

    // Do user defined stuff.
    this.onEnterFrameActions(this);
  }

  // update actors
  var that = this;
  for (var k in this.allKinds) {
    var kind = this.allKinds[k].forEachThing(function (thing) {
      if (thing.animation || that.skeletonLayer.visible) {
        var body = thing.body;
        var position = body.GetPosition();
        var rotation = body.GetAngleRadians() * 180 / Math.PI;
        var actor = thing.actor;
        actor.x = position.x;
        actor.y = position.y;
        actor.rotation = rotation;
        if (!that.pause) {
          actor.step(1 / 60);
        }
        if (that.skeletonLayer.visible && thing.skeleton) {
          var skeleton = thing.skeleton;
          skeleton.x = position.x;
          skeleton.y = position.y;
          skeleton.rotation = rotation;
        }
      }
    });
  }
};

BIB.World.prototype.stop = function () {
  if (!this.started) {
    return;
  }

  this.canvas.removeEventListener('mousedown', this.eventListeners.onMouseDown);
  window.removeEventListener('mousemove', this.eventListeners.onMouseMove);
  window.removeEventListener('mouseup', this.eventListeners.onMouseUp);
  this.canvas.removeEventListener(
      'touchstart', this.eventListeners.onTouchStart);
  this.canvas.removeEventListener('touchmove', this.eventListeners.onTouchMove);
  this.canvas.removeEventListener('touchend', this.eventListeners.onTouchEnd);
  this.stage.removeEventListener(
      Event.ENTER_FRAME, this.eventListeners.onEnterFrame);

  // Simulate a release of all touches and mouse clicks.
  for (var i in this.pointerInteractions) {
    var interaction = this.pointerInteractions[i];
    if (interaction) {
      interaction.mouseEvent = null;
      interaction.touchEvent = null;
      this.doOnPointerUp(interaction);
      delete this.pointerInteractions[i];
    }
  };

  this.started = false;
};
