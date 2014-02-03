'use strict';

// All the Things on this set. Each entry is a map of:
//   kind: name of the Kind
//   params: an initialParams object taken by world.newThing()
//   marker: the Thing marking this entry in the editor
var allThingDescriptors = [];

function updateMarkerFixture(thing) {
  // Also a bit hacky: change the size of the marker by replacing the
  // b2Fixture.
  var fixDef = thing.kind.fixDef;
  var scale = world.allKinds[thing.descriptor.kind].imageSize.Copy();
  scale.x *= thing.scale.x;
  scale.y *= thing.scale.y;
  fixDef.shape = world.scaleShape(thing.kind.shape, scale);
  var b = thing.body;
  b.DestroyFixture(b.GetFixtureList());
  b.CreateFixture(fixDef);
}

function addThing(kindName, inputParams) {
  var markerParams = BIB.getDefaultParams(inputParams);
  var thing = world.newThing('set-editor-thing-marker', markerParams);
  // Add a reference back to the descriptor.
  thing.descriptor = {
    kind: kindName,
    params: BIB.getDefaultParams(inputParams),
    marker: thing,
  };
  allThingDescriptors.push(thing.descriptor);

  // This is a bit hacky: we're copying the BIB code to replace the bitmap of
  // this marker to the kind that it represents.
  var kind = world.allKinds[kindName];
  var bd = kind.bitmapData;
  if (bd) {
    var bitmap = new Bitmap(bd);
    bitmap.x = -bd.width / 2;
    bitmap.y = -bd.height / 2;
    var actor = thing.actor;
    actor.removeChildAt(0);
    actor.addChild(bitmap);
    var is = kind.imageSize;
    actor.BIB_scaleX = is.x / bd.width;
    actor.BIB_scaleY = is.y / bd.height;
  }

  // Change the marker fixture to be the same size as the image.
  updateMarkerFixture(thing);

  return thing;
}

function loadFile(callback, fileEntry) {
  fileEntry.file(function (file) {
    var fileReader = new FileReader();
    fileReader.onload = function (e) {
      callback(JSON.parse(e.target.result));
    };
    fileReader.readAsText(file);
  }, function (e) {console.log(e)});
}

function openFile(callback) {
  chrome.fileSystem.chooseEntry({}, function (fileEntry) {
    loadFile(callback, fileEntry);
  });
}

function KindsList($scope) {
  $scope.kinds = {};

  $scope.load = function () {
    openFile($scope.processFile)
  };

  $scope.processFile = function (json) {
    for (var j in json) {
      var kind = world.setKind(json[j]);
      kind.initialize(function (kind) {
        $scope.$apply(function () {
          $scope.kinds[kind.name] = kind;
        });
      });
      // If there's no image, onImageLoaded (the callback passed to
      // initialize) does not get called, so do it here.
      if (!kind.image) {
        $scope.$apply(function () {
          $scope.kinds[kind.name] = kind;
        });
      }
    }
  };

  $scope.addThing = function (name) {
    addThing(name, {position: world.viewPosition.Copy()});
  };
}

function b2Vec2ToArray(vector) {
  return [Number(vector.x), Number(vector.y)];
}

function generateJson() {
  var descriptors = [];
  for (var i in allThingDescriptors) {
    var thingDescriptor = allThingDescriptors[i];
    var params = {
      position: b2Vec2ToArray(thingDescriptor.params.position),
      angle: Number(thingDescriptor.params.angle),
      scale: b2Vec2ToArray(thingDescriptor.params.scale),
      velocity: b2Vec2ToArray(thingDescriptor.params.velocity),
    };
    descriptors.push({
      kind: thingDescriptor.kind,
      params: params,
    });
  }
  var json = JSON.stringify(descriptors, undefined, 2);
  // Compress arrays.
  return json.replace(/\[[^\[\]]+\]/g, function (match) {
    return match.replace(/\s/g, '');
  });
}

function SetControls($scope) {
  $scope.load = function () {
    openFile($scope.processFile)
  };

  $scope.processFile = function (json) {
    for (var j in json) {
      var descriptor = json[j];
      addThing(descriptor.kind, descriptor.params);
    }
  };

  $scope.save = function () {
    chrome.fileSystem.chooseEntry({type: 'saveFile'}, $scope.saveFile);
  };

  $scope.saveFile = function (fileEntry) {
    fileEntry.createWriter(function (writer) {
      writer.onwriteend = function (e) {
        this.onwriteend = null;
        this.truncate(this.position);
      };
      writer.write(new Blob([generateJson()], {type: 'text/plain'}));
    }, function (e) {console.log(e)});
  };
}


function ThingParams($scope) {

  $scope.updateOutline = function () {
    $scope.removeOutline();

    $scope.outline = world.newThing('set-editor-marker-outline', {
      position: $scope.thing.body.GetPosition(),
      angle: $scope.thing.body.GetAngle(),
    });
    // Get the halfwidth and halfheight in BIB units.
    var kind = world.allKinds[$scope.thing.descriptor.kind];
    var x = kind.imageSize.x / 2;
    var y = kind.imageSize.y / 2;
    x *= $scope.thing.scale.x;
    y *= $scope.thing.scale.y;
    x *= world.pixelsPerMeter;
    y *= world.pixelsPerMeter;

    var actor = $scope.outline.actor;
    var sprite = new Sprite();
    sprite.graphics.lineStyle(1, 0x000000, 0.5);
    sprite.graphics.moveTo(-x, -y);
    sprite.graphics.lineTo(x, -y);
    sprite.graphics.lineTo(x, y);
    sprite.graphics.lineTo(-x, y);
    sprite.graphics.lineTo(-x, -y);
    sprite.graphics.moveTo(0, -10);
    sprite.graphics.lineTo(0, 3);
    sprite.graphics.moveTo(-3, 0);
    sprite.graphics.lineTo(3, 0);

    actor.removeChildAt(0);
    actor.addChild(sprite);
    actor.BIB_scaleX = 1 / world.pixelsPerMeter;
    actor.BIB_scaleY = 1 / world.pixelsPerMeter;
  }

  $scope.removeOutline = function () {
    if ($scope.outline) {
      $scope.outline.destroy();
      $scope.outline = undefined;
    }
  };

  $scope.attach = function (descriptor) {
    $scope.$apply(function () {
      $scope.kindName = descriptor.kind;
      $scope.params = descriptor.params;
      $scope.thing = descriptor.marker;
      $scope.updateOutline();
      $scope.attached = true;
    });
  };

  $scope.detach = function () {
    $scope.$apply($scope.detachNoApply);
  };
  $scope.detachNoApply = function () {
    $scope.attached = false;
    $scope.removeOutline();
    $scope.kindName = '';
    $scope.params = BIB.getDefaultParams();
    $scope.thing = undefined;
  };

  $scope.pushParams = function () {
    var b = $scope.thing.body;
    b.SetPosition($scope.params.position);
    b.SetAngle($scope.params.angle);
    $scope.thing.scale.SetV($scope.params.scale);
    updateMarkerFixture($scope.thing);
    $scope.updateOutline();
  };

  $scope.pullParams = function () {
    $scope.$apply($scope.pullParamsNoApply);
  };
  $scope.pullParamsNoApply = function () {
    $scope.params.position.x = $scope.thing.body.GetPosition().x.toFixed(2);
    $scope.params.position.y = $scope.thing.body.GetPosition().y.toFixed(2);
    $scope.updateOutline();
  };

  $scope.deleteThing = function() {
    allThingDescriptors.splice(
        allThingDescriptors.indexOf($scope.thing.descriptor), 1);
    $scope.thing.destroy();
    $scope.detachNoApply();
  }

  $scope.detachNoApply();
}

var snapUnit = 0.01;

function snapToGrid(position) {
  var unit = snapUnit;
  position.x = Math.round(position.x / unit) * unit;
  position.y = Math.round(position.y / unit) * unit;
}

function getParamsScope() {
  return angular.element(document.getElementById('params')).scope();
}

function onPointerDown(interaction) {
  interaction.pointerDownPosition = interaction.position.Copy();
  if (interaction.thing) {
    var body = interaction.thing.body;
    interaction.positionDelta = body.GetPosition().Copy();
    interaction.positionDelta.Subtract(interaction.pointerDownPosition);
    getParamsScope().attach(body.GetUserData().descriptor);
  } else {
    getParamsScope().detach();
  }
}

function onPointerMove(interaction) {
  if (!interaction.pointerDownPosition) {
    return;
  }

  if (interaction.thing) {
    var newPosition = interaction.position.Copy();
    newPosition.Add(interaction.positionDelta);
    snapToGrid(newPosition);
    interaction.thing.body.SetPosition(newPosition);
    getParamsScope().pullParams();
  } else {
    world.viewPosition.Subtract(interaction.position);
    world.viewPosition.Add(interaction.pointerDownPosition);
    world.updateView();
  }
}

function onPointerUp(interaction) {
  interaction.positionDelta = null;
  interaction.pointerDownPosition = null;
}

var world;

function start() {
  var	b2Vec2		      = box2d.b2Vec2;

  // Set the canvas' parent div size.
  var resize = function () {
    var toolbar = document.getElementById('toolbar');
    var kinds = document.getElementById('kinds-list');
    var container = document.getElementById('canvas-container');
    var params = document.getElementById('params');
    container.style.width =
        (window.innerWidth - kinds.offsetWidth - params.offsetWidth) + 'px';
    container.style.height = (window.innerHeight - toolbar.offsetHeight) + 'px';
  };
  resize();
  window.addEventListener('resize', resize);

  world = new world.World('c');
  world.setViewSize([20, 20]);

  var descriptors = {
    animations: [
      {
        name: 'origin-marker',
        file: '/images/origin-marker.png',
      },
      {
        name: 'no-image',
        file: '/images/no-image.png',
      },
      {
        name: 'unit-image',
        file: '/images/unit-image.png',
      },
    ],
    kinds: [
      {
        name: 'set-editor-origin-marker',
        animation: 'origin-marker',
        movementType: 'static',
      },
      {
        name: 'set-editor-thing-marker',
        animation: 'no-image',
        fixtures: [{}],
      },
      {
        name: 'set-editor-marker-outline',
        animation: 'unit-image',
        movementType: 'static',
      },
    ],

  };

  world.load(descriptors, onLoadComplete);
  world.pause = true;
}

function onLoadComplete() {
  world.newThing('set-editor-origin-marker');
  world.onPointerDown = onPointerDown;
  world.onPointerMove = onPointerMove;
  world.onPointerUp = onPointerUp;
  // This needs to be defined so that things of this type can be clicked on.
  world.allKinds['set-editor-thing-marker'].onPointerDown = function() {};

  world.start();
}

window.onload = start;

