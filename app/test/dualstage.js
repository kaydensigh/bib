// This whole setup is not possible at the moment because Stage uses a bunch of
// global variables in Stage.*. It also sets and owns window.gl. It assumes that
// there is only one Stage and one gl context. Until the Stage is made self
// contained, we cannot have multiple BIB.Worlds. However, BIB.World should be
// written to accommodate this in the future.

var stage1;
var stage2;

function Start()
{

  stage1 = new Stage('c1');

  var bd = new BitmapData('/images/chicken.png');

  for(var i=0; i<10; i++) {
    var b = new Bitmap(bd);
    stage1.addChild(b);
  }
  stage1.addEventListener(Event.ENTER_FRAME, onEF);
/*
  stage2 = new Stage('c2');
  for(var i=0; i<10; i++) {
    var b = new Bitmap(bd);
    stage2.addChild(b);
  }
  stage2.addEventListener(Event.ENTER_FRAME, onEF);
*/
}

function onEF(e) {
  for (var i = 0; i < stage1.numChildren; i++) {
    stage1.getChildAt(i).x += 1;
  }
/*
  for (var i = 0; i < stage2.numChildren; i++) {
    stage2.getChildAt(i).x += 1;
  }
*/
}

window.onload = Start;
