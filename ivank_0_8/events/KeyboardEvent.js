//	package net.ivank.display;


function KeyboardEvent(type, bubbles)
{
	Event.call(this, type, bubbles);
	
	this.altKey = false;
	this.ctrlKey = false;
	this.shiftKey = false;
	
	this.keyCode = 0;
	this.charCode = 0;
}
KeyboardEvent.prototype = new Event();

KeyboardEvent.prototype._setFromDom = function(e)
{
	this.altKey		= e.altKey;
	this.ctrlKey	= e.ctrlKey;
	this.shiftKey	= e.ShiftKey;

	this.keyCode	= e.keyCode;
	this.charCode	= e.charCode;
}

KeyboardEvent.KEY_DOWN	= "keyDown";
KeyboardEvent.KEY_UP	= "keyUp";
