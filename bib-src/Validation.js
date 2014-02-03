BIB.validateArray = function (array, output) {
  if (!Array.isArray(array)) {
    console.log(output + ' should be contained in an array.');
  }
};

BIB.validateString = function (string, output) {
  if (typeof string != 'string') {
    console.log(output + ' should be a string.');
  }
};

BIB.validateObject = function (object, output) {
  if (typeof object != 'object') {
    console.log(output + ' should be an object.');
  }
};

BIB.validateAttributes = function (object, attributes) {
  for (var a in object) {
    if (attributes.indexOf(a) == -1) {
      console.log('Unknown attribute: ' + a);
    }
  }
};

BIB.validateNumber = function (number, output) {
  if (typeof number != 'number') {
    console.log(output + ' should be a number.');
  }
};

BIB.validateBoolean = function (number, output) {
  if (typeof number != 'boolean') {
    console.log(output + ' should be a boolean.');
  }
};

BIB.validateVector = function (vector, output) {
  var	b2Vec2		      = box2d.b2Vec2;

  if (!(Array.isArray(vector) && vector.length == 2) &&
      !(vector instanceof b2Vec2)) {
    console.log(output + ' should be a vector.');
  }
};

BIB.optionallyValidate = function (func, object, param2) {
  if (object !== undefined) {
    func(object, param2);
  }
};

BIB.validateArrayOfStrings = function (array, output) {
  BIB.validateArray(array, output);
  array.forEach(function (element) {
    BIB.validateString(element, output);
  });
};

BIB.validateArrayOfVectors = function (array, output) {
  BIB.validateArray(array, output);
  array.forEach(function (element) {
    BIB.validateVector(element, output);
  });
};

BIB.validateAnimationDescriptors = function (animations) {
  var optional = BIB.optionallyValidate;

  if (!animations) {
    return;
  }

  var animationAttributes =
      ['name', 'file', 'size', 'offset', 'alpha', 'speed', 'gridDimensions',
       'frameCount', 'frameOffset', 'blendMode'];

  BIB.validateArray(animations, 'Animation descriptors');
  animations.forEach(function (animation) {
    BIB.validateObject(animation, 'Animation descriptor');
    BIB.validateAttributes(animation, animationAttributes);
    BIB.validateString(animation.name, 'Animation name');
    BIB.validateString(animation.file, 'Animation file');
    optional(BIB.validateVector, animation.size, 'Animation size');
    optional(BIB.validateVector, animation.offset, 'Animation offset');
    optional(BIB.validateNumber, animation.alpha, 'Animation alpha');
    optional(BIB.validateNumber, animation.speed, 'Animation speed');
    optional(BIB.validateVector,
             animation.gridDimensions,
             'Animation grid dimensions');
    optional(BIB.validateNumber, animation.frameCount, 'Animation frame count');
    optional(BIB.validateNumber,
             animation.frameOffset,
             'Animation frame offset');
    optional(BIB.validateString,
             animation.blendMode,
             'Animation blend mode');
  });
};

BIB.validateFixtureDescriptors = function (fixtures) {
  var	b2Vec2		      = box2d.b2Vec2;

  var optional = BIB.optionallyValidate;

  var fixtureAttributes =
      ['shapeType', 'shapeData', 'properties', 'collisionFilter'];

  BIB.validateArray(fixtures, 'Fixture descriptors fixtures');
  fixtures.forEach(function (fixture) {
    BIB.validateObject(fixture, 'Fixture descriptor');
    BIB.validateAttributes(fixture, fixtureAttributes);

    optional(BIB.validateString, fixtures.shapeType, 'Fixture\'s shape type');
    if (fixtures.shapeData !== undefined) {
      var type = fixtures.shapeType;
      var data = fixtures.shapeData;
      if (type == 'circle') {
        BIB.validateNumber(data, '\'circle\' shape type');
      } else if (type == 'box' &&
                 typeof data != 'number' &&
                 !((Array.isArray(data) && data.length == 2) ||
                   (data instanceof b2Vec2))) {
        console.log('\'box\' shape type must be number or vector.');
      } else if (type == 'polygon' ||
                 type == 'chain' ||
                 type == 'loop') {
        BIB.validateArrayOfVectors(
            data, '\'polygon\', \'chain\', or \'loop\' shape data');
      } else {
        console.log('Unknown shape type: ' + type);
      }
    }

    if (fixture.properties !== undefined) {
      var p = fixture.properties;
      BIB.validateObject(p, 'Fixture properties');
      BIB.validateAttributes(
          p,
          ['density', 'friction', 'restitution', 'isSensor']);
      optional(BIB.validateNumber, p.density, 'Fixture\'s density');
      optional(BIB.validateNumber, p.friction, 'Fixture\'s friction');
      optional(BIB.validateNumber, p.restitution, 'Fixture\'s restitution');
      optional(BIB.validateBoolean, p.isSensor, 'Fixture isSensor');
    }

    if (fixture.collisionFilter != undefined) {
      var cf = fixture.collisionFilter;
      BIB.validateObject(cf, 'Collision filter');
      BIB.validateAttributes(cf,
          ['collisionCategories', 'onlyCollidesWith', 'doesNotCollideWith']);
      optional(BIB.validateArrayOfStrings,
               cf.collisionCategories,
               'Fixture\'s collision categories');
      optional(BIB.validateArrayOfStrings,
               cf.onlyCollidesWith,
               'onlyCollidesWith');
      optional(BIB.validateArrayOfStrings,
               cf.doesNotCollideWith,
               'doesNotCollideWith');
    }
  });
};

BIB.validateKindDescriptors = function (kinds) {
  var optional = BIB.optionallyValidate;

  if (!kinds) {
    return;
  }

  var kindAttributes =
      ['name', 'animation', 'animationOffset', 'fixtures', 'movementType',
       'linearDamping', 'angularDamping', 'fixedRotation'];

  BIB.validateArray(kinds, 'Kind descriptors');
  kinds.forEach(function (kind) {
    BIB.validateObject(kind, 'Kind descriptor');
    BIB.validateAttributes(kind, kindAttributes);
    BIB.validateString(kind.name, 'Kind name');
    optional(BIB.validateString, kind.animation, 'Kind\'s animation');
    optional(BIB.validateVector,
             kind.animationOffset,
             'Kind\'s animation offset');

    optional(BIB.validateFixtureDescriptors, kind.fixtures);

    var movementTypes = ['dynamic', 'static', 'kinematic'];
    if (kind.movementType !== undefined &&
        movementTypes.indexOf(kind.movementType) == -1) {
      console.log('Kind\'s movement type must be one of ' +
                  '\'dynamic\', \'static\', or \'kinematic\'');
    }

    optional(BIB.validateNumber, kind.linearDamping, 'Kind\'s linear damping');
    optional(BIB.validateNumber, kind.angularDamping, 'Kind\'s angular damping');
    if (kind.fixedRotation !== undefined) {
      if (typeof kind.fixedRotation != 'boolean') {
        console.log('Kind\'s rotation fixed-ness should be a boolean.');
      }
    }
  });
};

BIB.validateThingDescriptors = function (things) {
  var optional = BIB.optionallyValidate;

  things.forEach(function (thing) {
    BIB.validateObject(thing, 'Thing descriptor');
    BIB.validateAttributes(thing, ['kind', 'params']);
    BIB.validateString(thing.kind, 'Thing\'s Kind');
    if (thing.params) {
      BIB.validateObject(thing.params, 'Thing\'s params');
      BIB.validateAttributes(thing.params, Object.keys(BIB.getDefaultParams()));
      optional(BIB.validateVector, thing.position, 'Things\'s position');
      optional(BIB.validateNumber, thing.angle, 'Things\'s angle');
      optional(BIB.validateVector, thing.scale, 'Things\'s scale');
      optional(BIB.validateNumber, thing.alpha, 'Things\'s alpha');
      optional(BIB.validateNumber, thing.depth, 'Things\'s depth');
      optional(BIB.validateVector, thing.velocity, 'Things\'s velocity');
      optional(BIB.validateString, thing.animation, 'Things\'s animation');
    }
  });
};

BIB.validateSetDescriptors = function (sets) {
  if (!sets) {
    return;
  }

  BIB.validateArray(sets, 'Set descriptors');
  sets.forEach(function (currentSet) {
    BIB.validateObject(currentSet, 'Set descriptor');
    BIB.validateAttributes(currentSet, ['name', 'things']);
    BIB.validateString(currentSet.name, 'Set name');
    BIB.validateArray(currentSet.things, 'List of Things in a Set');
    BIB.validateThingDescriptors(currentSet.things);
  });
};
