"use strict";

chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('menu.html', {
    'width': 300,
    'height': 300,
  });
});
