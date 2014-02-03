	//package net.ivank.cb;

	
	//import net.ivank.display.Sprite;
	
	function Resizable(wi, hi)
	{
		Sprite.call(this);
		
		this.w = wi;
		this.h = hi;
		this.margin = 30;
	}
	Resizable.prototype = new Sprite();
	
	Resizable.prototype.resize = function(wi, hi)
	{
		this.w = wi;
		this.h = hi;
	}
