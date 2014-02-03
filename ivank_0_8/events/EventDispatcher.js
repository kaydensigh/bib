
function EventDispatcher()
{
	this.lsrs = {};		// hash table for listeners ... Key (Event type) : Array of functions
	this.cals = {};		// hash table for objects   ... Key (Event type) : Array of Objects, on which function should be called
}

EventDispatcher.efbc = [];	// objects, on which EnterFrame will be broadcasted

EventDispatcher.prototype.hasEventListener = function(type)
{
	var fs = this.lsrs[type];		// functions for this event
	if (fs == null) return false;
	return (fs.length > 0);
}

EventDispatcher.prototype.addEventListener = function(type, f)
{
	this.addEventListener2(type, f, null);
}

EventDispatcher.prototype.addEventListener2 = function(type, f, o)	// string, function
{
	if(this.lsrs[type] == null)
	{
		this.lsrs[type] = [];
		this.cals[type] = [];
	}
	this.lsrs[type].push(f);
	this.cals[type].push(o);
	
	if(type == Event.ENTER_FRAME)
	{
		var arEF = EventDispatcher.efbc;
		if(arEF.indexOf(this) < 0) arEF.push(this);
	}
}

EventDispatcher.prototype.removeEventListener = function(type, f)	// string, function
{
	var fs = this.lsrs[type];		// functions for this event
	if (fs == null) return;
	var ind = fs.indexOf(f);
	if(ind < 0) return;
	var cs = this.cals[type];
	fs.splice(ind, 1);
	cs.splice(ind, 1);
	
	if(type == Event.ENTER_FRAME && fs.length == 0)
	{
		var arEF = EventDispatcher.efbc;
		arEF.splice(arEF.indexOf(this), 1);
	}
}

EventDispatcher.prototype.dispatchEvent = function(e)	// Event
{
	var fs = this.lsrs[e.type];
	if (fs == null) return;
	var cs = this.cals[e.type];
	for (var i=0; i<fs.length; i++) 
	{
		e.currentTarget = this;
		if(e.target == null) e.target = this;
		if(cs[i] == null) fs[i](e);
		else fs[i].call(cs[i], e);
	}
}
