
function Event(type, bubbles)
{
	if(!bubbles) bubbles= false;
	this.type			= type;
	this.target			= null;
	this.currentTarget	= null;
	this.bubbles		= bubbles;
}

Event.ENTER_FRAME			= "enterFrame";
Event.RESIZE				= "resize";
Event.ADDED_TO_STAGE 		= "addedToStage";
Event.REMOVED_FROM_STAGE 	= "removedFromStage";

Event.CHANGE				= "change";

Event.OPEN					= "open";
Event.PROGRESS				= "progress";
Event.COMPLETE				= "complete";