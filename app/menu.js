"use strict";

document.getElementById('basic').onclick = function() {
  chrome.app.window.create('/examples/basic/basic.html', {
    'width': 800,
    'height': 600,
  });
};
document.getElementById('kinds').onclick = function() {
  chrome.app.window.create('/examples/kinds/kinds.html', {
    'width': 800,
    'height': 600,
  });
};
document.getElementById('fixtures').onclick = function() {
  chrome.app.window.create('/examples/fixtures/fixtures.html', {
    'width': 800,
    'height': 600,
  });
};
document.getElementById('sets').onclick = function() {
  chrome.app.window.create('/examples/sets/sets.html', {
    'width': 800,
    'height': 600,
  });
};
document.getElementById('collisions').onclick = function() {
  chrome.app.window.create('/examples/collisions/collisions.html', {
    'width': 800,
    'height': 600,
  });
};
document.getElementById('interaction').onclick = function() {
  chrome.app.window.create('/examples/interaction/interaction.html', {
    'width': 800,
    'height': 600,
  });
};
document.getElementById('animations').onclick = function() {
  chrome.app.window.create('/examples/animations/animations.html', {
    'width': 800,
    'height': 600,
  });
};
document.getElementById('blendmode').onclick = function() {
  chrome.app.window.create('/examples/blendmode/blendmode.html', {
    'width': 800,
    'height': 600,
  });
};
document.getElementById('joints').onclick = function() {
  chrome.app.window.create('/examples/joints/joints.html', {
    'width': 800,
    'height': 600,
  });
};
document.getElementById('contacts').onclick = function() {
  chrome.app.window.create('/examples/contacts/contacts.html', {
    'width': 800,
    'height': 600,
  });
};




document.getElementById('world-editor').onclick = function() {
  chrome.app.window.create('/editors/world-editor.html', {
    'width': 800,
    'height': 600,
  });
};
document.getElementById('test').onclick = function() {
  chrome.app.window.create('/test/test.html', {
    'width': 800,
    'height': 600,
  });
};
document.getElementById('box2d-benchmark').onclick = function() {
  chrome.app.window.create('/test/box2d-benchmark.html', {
    'width': 800,
    'height': 600,
  });
};
