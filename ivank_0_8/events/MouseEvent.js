//	package net.ivank.events;

function MouseEvent(type, bubbles)
{
	Event.call(this, type, bubbles);
	
	this.movementX = 0;
	this.movementY = 0;
}
MouseEvent.prototype = new Event();


MouseEvent.CLICK		= "click";
MouseEvent.MOUSE_DOWN	= "mouseDown";
MouseEvent.MOUSE_UP		= "mouseUp";

MouseEvent.MIDDLE_CLICK	= "middleClick";
MouseEvent.MIDDLE_MOUSE_DOWN	= "middleMouseDown";
MouseEvent.MIDDLE_MOUSE_UP		= "middleMouseUp";

MouseEvent.RIGHT_CLICK	= "rightClick";
MouseEvent.RIGHT_MOUSE_DOWN	= "rightMouseDown";
MouseEvent.RIGHT_MOUSE_UP	= "rightMouseUp";


MouseEvent.MOUSE_MOVE	= "mouseMove";
MouseEvent.MOUSE_OVER	= "mouseOver";
MouseEvent.MOUSE_OUT	= "mouseOut";