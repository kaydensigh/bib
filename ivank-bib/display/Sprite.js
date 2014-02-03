
	function Sprite()
	{
		DisplayObjectContainer.call(this);
		
		this.graphics = new Graphics();
	}
	Sprite.prototype = new DisplayObjectContainer();
	
	
	Sprite.prototype._render = function(st)
	{
		if(!this.graphics._empty) this.graphics._render(st);
		DisplayObjectContainer.prototype._render.call(this, st);
	}
	
	Sprite.prototype._moveMouse = function(nx, ny, chColl)
	{
		if(!chColl || !this.visible || (!this.mouseChildren && !this.mouseEnabled)) return null; 
		
		var tgt = DisplayObjectContainer.prototype._moveMouse.call(this, nx, ny, chColl);
		if(tgt != null) return tgt;
		
		if(!this.mouseEnabled) return null;
		var t = this._temp;
		if(this.graphics._hits(t[0], t[1])) return this;
		return null;
	}
	
	Sprite.prototype._getRect = function(stks)
	{
		var r;
		var r1 = DisplayObjectContainer.prototype._getRect.call(this, stks);
		var r2 = this.graphics._getRect(stks);
		
		if(r1 != null && r2 != null) r1._unionWith(r2);
		if(r1 != null) r = r1; else r = r2;
		return r;
	}
	
	Sprite.prototype._htpLocal = function(pt)
	{
		var t = this._temp;
		Point._m4.multiplyVec2(this._getIMat(), pt, t);
		if(this.graphics._hits(t[0], t[1])) return true;
		return DisplayObjectContainer.prototype._htpLocal.call(this, pt);
	}