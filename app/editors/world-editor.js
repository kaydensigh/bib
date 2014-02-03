'use strict';

// Given a descriptor, try to guess what it's for.
function getDescriptorType(json) {
  function hasFile(descriptor) {
    return descriptor.file !== undefined;
  }
  function hasThings(descriptor) {
    return descriptor.things !== undefined;
  }
  function hasNoThingsOrFile(descriptor) {
    return descriptor.things === undefined && descriptor.file === undefined;
  }

  if (json.length == json.filter(hasFile).length) {
    return 'animations';
  }
  if (json.length == json.filter(hasThings).length) {
    return 'sets';
  }
  if (json.length == json.filter(hasNoThingsOrFile).length) {
    return 'kinds';
  }
};

function formatJson(item) {
  if (!item) {
    return '';
  }
  var discardAngularProperties = function (key, value) {
    // Discard keys that start with '$'.
    if (key.lastIndexOf('$', 0) === 0) {
      return undefined;
    }
    return value;
  };

  var json = JSON.stringify(item, discardAngularProperties, 2);
  // Compress arrays.
  return json.replace(/\[[^\[\]{}]+\]/g, function (match) {
    return match.replace(/\s/g, '');
  });
};

var worldEditor = angular.module('worldEditor', ['uiSlider', 'angularTreeview']);

var TreeElement = function (id, type) {
  this.label = id;
  this.id = id;
  this.type = type;
  this.children = [];
};
TreeElement.prototype.addChild = function (child) {
  this.children.push(child);
};
TreeElement.prototype.getChildById = function (id) {
  for (var c in this.children) {
    var child = this.children[c];
    if (child.id == id) {
      return child;
    }
  }
  return null;
};

var FileTreeElement = function (fileEntry) {
  TreeElement.call(this, fileEntry.fullPath, 'file');
  this.fileEntry = fileEntry;
};
FileTreeElement.prototype = new TreeElement();

var ItemTreeElement = function (item, type) {
  TreeElement.call(this, item.name, type);
  this.item = item;
};
ItemTreeElement.prototype = new TreeElement();

function ItemsTree($scope) {
  $scope.show = true;

  $scope.reset = function () {
    $scope.currentDirectory = '';

    $scope.animations = new TreeElement('animations', 'top-level');
    $scope.kinds = new TreeElement('kinds', 'top-level');
    $scope.sets = new TreeElement('sets', 'top-level');

    $scope.treeList = [$scope.animations, $scope.kinds, $scope.sets];
  }

  $scope.open = function () {
    openDir();
  };

  $scope.setCurrentDirectory = function (path) {
    $scope.currentDirectory = path;
  };

  $scope.addFile = function (type, fileEntry) {
    $scope[type].addChild(new FileTreeElement(fileEntry));
  };

  $scope.addItem = function (type, filePath, item) {
    var fileTreeElement = $scope[type].getChildById(filePath);
    fileTreeElement.addChild(new ItemTreeElement(item, type));
  };

  $scope.formatItem = formatJson;

  $scope.edit = function(item) {
    kindEditor.scope().descriptor = item;
  };

  $scope.reset();
};

function processFileEntry(fileEntry) {
  var scope = itemsTree.scope();

  fileEntry.file(function (file) {
    var reader = new FileReader();
    reader.onloadend = function (e) {
      try {
        var json = JSON.parse(this.result);
        var type = getDescriptorType(json);
        scope.$apply(function () { scope.addFile(type, fileEntry); });
        var descriptors = {};
        descriptors[type] = json;
        world.load(descriptors, function (world, loadedItems) {
          scope.$apply(function () {
            for (var i in loadedItems[type]) {
              var item = loadedItems[type][i];
              scope.addItem(type, fileEntry.fullPath, item);
            }
          });
        });
      } catch (e) {
        // Ignore non-json files.
      }
    }
    reader.readAsText(file);
  }, errorHandler);
}

function readDir(entry) {
  var scope = itemsTree.scope();
  scope.$apply(function () {
    scope.setCurrentDirectory(entry.fullPath);
  });
  var dirReader = entry.createReader();
  var readEntries = function () {
    dirReader.readEntries(
        function (results) {
          if (!results.length) {
            return;
          }
          results.forEach(function (item) {
            processFileEntry(item);
          });
          readEntries();
        }, errorHandler);
  };
  readEntries();
}

function openDir() {
  chrome.fileSystem.chooseEntry(
      { type: 'openDirectory' },
      function (entry) {
        if (!entry || !entry.isDirectory) {
          return;
        }
        retainDirectoryEntry(entry);
        itemsTree.scope().$apply(function () { itemsTree.scope().reset(); });
        resetWorld(function () { readDir(entry); });
      });
};

function retainDirectoryEntry(entry) {
  var id = chrome.fileSystem.retainEntry(entry);
  chrome.storage.local.set({'currentDirectory': id});
};

function restoreDirectoryEntry() {
  chrome.storage.local.get('currentDirectory', function(items) {
    if (items.currentDirectory) {
      chrome.fileSystem.restoreEntry(items.currentDirectory, function(directoryEntry) {
        if (directoryEntry && directoryEntry.isDirectory) {
          readDir(directoryEntry);
        }
      });
    }
  });
};

function errorHandler(e) {
  console.error(e);
}

function KindEditor($scope) {
  $scope.show = true;

  $scope.descriptor = {};

  $scope.selected = {};

  $scope.formatFixture = formatJson;

  $scope.select = function (fixture) {
    $scope.selected = fixture;
  };
}

function getZoom(level) {
  return Math.pow(2, level);
};

function ZoomControl($scope) {
  $scope.zoomLevel = 0;
  $scope.getZoomLevelText = function (level) {
    return getZoom(level).toFixed(2);
  };
};

function GridControl($scope) {
  $scope.gridSizeX = 1;
  $scope.gridSizeY = 1;
  $scope.viewPositionX = 0;
  $scope.viewPositionY = 0;

  $scope.increase = function () {
    $scope.gridSizeX *= 2;
    $scope.gridSizeY *= 2;
  };

  $scope.decrease = function () {
    $scope.gridSizeX *= 0.5;
    $scope.gridSizeY *= 0.5;
  };

  $scope.center = function () {
    $scope.viewPositionX = 0;
    $scope.viewPositionY = 0;
  };
};

function PauseControl($scope) {
  $scope.buttonText = function () {
    return (world && world.pause) ? 'unpause' : 'pause';
  };

  $scope.pause = function () {
    world.pause = true;
  };

  $scope.toggle = function () {
    world.pause = !world.pause;
  };
}

var itemsTree;
var kindEditor;

var zoomControl;
var gridControl;
var pauseControl;

var world;
var defaultViewSize;

function resetWorld(onLoadComplete) {
  world.unload();

  var editorDescriptors = {
    animations: [{ name: 'unit-image', file: '/images/unit-image.png' }],
    kinds: [
      { name: 'world-editor-animation-holder' },
      { name: 'world-editor-axis-line',
        animation: 'unit-image' }
    ] ,
  };
  world.load(editorDescriptors, function () {
    world.onPointerDown = onPointerDown;
    world.onPointerMove = onPointerMove;
    world.onPointerUp = onPointerUp;
    world.pause = true;  // Otherwise overlapping fixtures will move each other.
    world.skeletonLayer.visible = true;

    onLoadComplete();
  });
}

function start() {
  var b2Vec2 = box2d.b2Vec2;

  itemsTree = angular.element(document.getElementById('items-tree'));
  kindEditor = angular.element(document.getElementById('kind-editor'));

  zoomControl = angular.element(document.getElementById('zoom-control'));
  gridControl = angular.element(document.getElementById('grid-control'));
  pauseControl = angular.element(document.getElementById('pause-control'));

  defaultViewSize = new b2Vec2(10, 10);
  world = new BIB.World('c');
  world.setViewSize(defaultViewSize);

  resetWorld(function () {
    world.start();

    itemsTree.scope().$watch('itemsTree.currentNode', showSelectedTreeElement);
    zoomControl.scope().$watch('zoomLevel', updateZoomLevel);
    gridControl.scope().$watch(
        '[gridSizeX, gridSizeY, viewPositionX, viewPositionY]',
        updateZoomLevel, true);

    restoreDirectoryEntry();
  });
}

function showSelectedTreeElement(element) {
  if (!itemsTree.scope().show) {
    return;
  }

  clearWorld();
  if (element instanceof TreeElement) {
    if (element.type === 'animations') {
      showAnimation(element.id);
    } else if (element.type === 'kinds') {
      showKind(element.id);
    } else if (element.type === 'sets') {
      showSet(element.id);
    }
  }
}

function clearWorld() {
  for (var k in world.allKinds) {
    var kind = world.allKinds[k];
    kind.forEachThing(function (thing) {
      if (thing.depth === 0) {
        thing.destroy();
      }
    });
  }
  pauseControl.scope().pause();
}

function showAnimation(animation) {
  var t = world.newThing('world-editor-animation-holder',
                         { animation: animation });
  t.actor.onAnimationFinished = AnimatedBitmap.LOOP;
}

function showKind(kind) {
  var t = world.newThing(kind);
  t.actor.onAnimationFinished = AnimatedBitmap.LOOP;
}

function showSet(set) {
  world.newThingsFromSet(world.allSets[set]);
}

function updateZoomLevel() {
  var zoomLevel = zoomControl.scope().zoomLevel;
  var newViewSize = defaultViewSize.Clone();
  newViewSize.SelfMul(getZoom(-zoomLevel));
  var gridSizeX = gridControl.scope().gridSizeX;
  var gridSizeY = gridControl.scope().gridSizeY;
  var viewPositionX = gridControl.scope().viewPositionX;
  var viewPositionY = gridControl.scope().viewPositionY;

  while (gridSizeX * world.pixelsPerMeter < 3) {
    gridSizeX *= 2;
  }
  while (gridSizeY * world.pixelsPerMeter < 3) {
    gridSizeY *= 2;
  }

  world.allKinds['world-editor-axis-line'].forEachThing(function (thing) {
    thing.destroy();
  });

  var round = function (value, rounding) {
    return Math.round(value / rounding) * rounding;
  };

  var thickness = 1 / world.pixelsPerMeter;

  world.newThing('world-editor-axis-line', {
      position: [viewPositionX, 0],
      scale: [newViewSize.x, thickness], depth: 1, alpha: 0.5 });
  world.newThing('world-editor-axis-line', {
      position: [0, viewPositionY],
      scale: [thickness, newViewSize.y], depth: 1, alpha: 0.5 });

  for (var i = -0.5 * newViewSize.x; i < 0.5 * newViewSize.x; i += gridSizeX) {
    world.newThing('world-editor-axis-line', {
        position: [round(i + viewPositionX, gridSizeX), viewPositionY],
        scale: [thickness, newViewSize.y], depth: 1, alpha: 0.1 });
  }
  for (var i = -0.5 * newViewSize.y; i < 0.5 * newViewSize.y; i += gridSizeY) {
    world.newThing('world-editor-axis-line', {
        position: [viewPositionX, round(i + viewPositionY, gridSizeY)],
        scale: [newViewSize.x, thickness], depth: 1, alpha: 0.1 });
  }

  world.setViewSize(newViewSize);
  world.setViewPosition([viewPositionX, viewPositionY]);
}

function onPointerDown(interaction) {
  interaction.pointerDownPosition = interaction.position.Clone();
}

function onPointerMove(interaction) {
  if (!interaction.pointerDownPosition) {
    return;
  }

  var delta = interaction.position.Clone();
  delta.SelfSub(interaction.pointerDownPosition);
  gridControl.scope().$apply(function () {
    gridControl.scope().viewPositionX -= delta.x;
    gridControl.scope().viewPositionY -= delta.y;
  });
}

function onPointerUp(interaction) {
  interaction.pointerDownPosition = null;
}

window.onload = start;