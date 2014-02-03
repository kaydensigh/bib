
	/** 
	 * A basic class in the Display API
	 * 
	 * @author Ivan Kuckir
	 * @version 1.0
	 */
	function DisplayObject()
	{		
		EventDispatcher.call(this);
		
		this.visible	= true;
		
		this.parent		= null;
		this.stage		= null;
		
		this.transform	= new Transform();
		this.transform._obj = this;
		
		this.blendMode	= BlendMode.NORMAL;
		
		//	for fast access
		this.x			= 0;
		this.y			= 0;
		this.z			= 0;
		
		this._brect		= new Rectangle(0, 0, 0, 0);
		
		this._temp		= new Float32Array(2);
		this._temp2		= new Float32Array(2);
		this._tempm		= Point._m4.create();
		
		this._atsEv	= new Event(Event.ADDED_TO_STAGE);
		this._rfsEv	= new Event(Event.REMOVED_FROM_STAGE);
		this._atsEv.target = this._rfsEv.target = this;
	}
	DisplayObject.prototype = new EventDispatcher();
	
	DisplayObject.prototype.dispatchEvent = function(e)	// : returns the deepest active InteractiveObject of subtree
	{
		EventDispatcher.prototype.dispatchEvent.call(this, e);
		if(e.bubbles && this.parent != null) this.parent.dispatchEvent(e);
	}
	
	DisplayObject.prototype.globalToLocal = function(p)
	{
		var t = this._temp;
		t[0] = p.x;  t[1] = p.y;
		Point._m4.multiplyVec2(this._getAIMat(), t, t);
		return new Point(t[0], t[1]);
	}
	
	DisplayObject.prototype.localToGlobal = function(p)
	{
		var t = this._temp;
		t[0] = p.x;  t[1] = p.y;
		Point._m4.multiplyVec2(this._getATMat(), t, t);
		return new Point(t[0], t[1]);
	}
	
	DisplayObject.prototype.hitTestPoint = function(p)
	{
		var t = this._temp2;
		t[0] = p.x;  t[1] = p.y;
		Point._m4.multiplyVec2(this._getAIMat(), t, t);	// global to local
		Point._m4.multiplyVec2(this.transform._getTMat(), t, t);	// local to parent
		return this._htpLocal(t);
	}
	
	DisplayObject.prototype.hitTestObject = function(obj)
	{
		var r1 = this._getRect(false);
		var r2 = obj ._getRect(false);
		if(!r1 || !r2) return false;
		
		var m1 = this._getATMat();
		var m2 = obj ._getATMat();
		
		var rr1 = r1.clone(), rr2 = r2.clone();
		rr1._setAndTransform(r1, m1);
		rr2._setAndTransform(r2, m2);
		
		return rr1.intersects(rr2);
	}
	
	DisplayObject.prototype.getRect = function(tcs)
	{
		return this._makeRect(false, tcs);
	}
	
	DisplayObject.prototype.getBounds = function(tcs)
	{
		return this._makeRect(true , tcs);
	}
	
	DisplayObject.prototype._makeRect = function(strokes, tcs)
	{
		var or = this._getRect(strokes);
		var m = this._tempm;
		Point._m4.multiply(this._getATMat(), tcs._getAIMat(), m);
		var r = new Rectangle(6710886.4,6710886.4,0,0);
		if(or) r._setAndTransform(or, m); 
		return r;
	}
	
	/*
		Check, whether object hits pt[0], pt[1] in parent coordinate system
	*/
	
	DisplayObject.prototype._htpLocal = function(pt)
	{
		var t = this._temp;
		Point._m4.multiplyVec2(this.transform._getIMat(), pt, t);
		var r = this._getRect();
		if(r == null) return false;
		return r.contains(t[0], t[1]);
	}
	
	/*
		Returns the deepest InteractiveObject of subtree with mouseEnabled = true
	*/
	
	DisplayObject.prototype._moveMouse = function(nx, ny, chColl)	
	{
		return null;
	}
	
	/** 
	 * Returns a bounding rectangle of a display object, in local coordinate system.
	 * 
	 * @stks 	check strokes
	 * @return 	a bounding rectangle
	 */
	DisplayObject.prototype._getRect = function(stks){return this._brect;}
	
	
	DisplayObject.prototype._setStage = function(st)
	{
		var pst = this.stage;	// previous stage
		this.stage = st;
		if(pst == null && st != null) this.dispatchEvent(this._atsEv);
		if(pst != null && st == null) this.dispatchEvent(this._rfsEv);
	}
	
	/** 
	 * This method adds a drawing matrix onto the OpenGL stack
	 */
	DisplayObject.prototype._preRender = function(st)
	{
		var m = this.transform._getTMat();
		st._mstack.push(m);
		st._cmstack.push(this.transform._cmat, this.transform._cvec, this.transform._cID, this.blendMode);
	}
	
	
	
	/** 
	 * This method renders the current content
	 */
	DisplayObject.prototype._render = function(st)
	{
	}
	
	/** 
	 * This method renders the whole object
	 */
	DisplayObject.prototype._renderAll = function(st)
	{
		if(!this.visible) return;
		
		this._preRender(st);
		this._render(st);
		st._mstack.pop();
		st._cmstack.pop();
	}
	
	/*
		Absolute Inverse Transform matrix
	*/
	
	DisplayObject.prototype._getATMat = function()
	{
		if(this.parent == null) return this.transform._getTMat();
		Point._m4.multiply(this.parent.transform._getTMat(), this.transform._getTMat(), this.transform._atmat);
		return this.transform._atmat;
	}
	
	/*
		Absolute Inverse Transform matrix
	*/
	
	DisplayObject.prototype._getAIMat = function()
	{
		if(this.parent == null) return this.transform._getIMat();
		Point._m4.multiply(this.transform._getIMat(), this.parent._getAIMat(), this.transform._aimat);
		return this.transform._aimat;
	}
	
	DisplayObject.prototype._getMouse = function()
	{
		var t = this._temp;
		t[0] = Stage._mouseX;  t[1] = Stage._mouseY;
		Point._m4.multiplyVec2(this._getAIMat(), t, t);
		return t;
	}
	
	this.dp = DisplayObject.prototype;
	dp.ds = dp.__defineSetter__;
	dp.dg = dp.__defineGetter__;
	
	/*
	dp.ds("x", function(x){this._tmat[12] = x; this._imat[12] = -x;});
	dp.ds("y", function(y){this._tmat[13] = y; this._imat[13] = -y;});
	dp.ds("z", function(z){this._tmat[14] = z; this._imat[14] = -z;});
	dp.dg("x", function( ){return this._tmat[12];});
	dp.dg("y", function( ){return this._tmat[13];});
	dp.dg("z", function( ){return this._tmat[14];});
	*/
	
	dp.ds("scaleX", function(sx){this.transform._checkVals(); this.transform._scaleX = sx; this.transform._mdirty = true;});
	dp.ds("scaleY", function(sy){this.transform._checkVals(); this.transform._scaleY = sy; this.transform._mdirty = true;});
	dp.ds("scaleZ", function(sz){this.transform._checkVals(); this.transform._scaleZ = sz; this.transform._mdirty = true;});
	dp.dg("scaleX", function(  ){this.transform._checkVals(); return this.transform._scaleX;});
	dp.dg("scaleY", function(  ){this.transform._checkVals(); return this.transform._scaleY;});
	dp.dg("scaleZ", function(  ){this.transform._checkVals(); return this.transform._scaleZ;});
	
	dp.ds("rotationX", function(r){this.transform._checkVals(); this.transform._rotationX = r; this.transform._mdirty = true;});
	dp.ds("rotationY", function(r){this.transform._checkVals(); this.transform._rotationY = r; this.transform._mdirty = true;});
	dp.ds("rotationZ", function(r){this.transform._checkVals(); this.transform._rotationZ = r; this.transform._mdirty = true;});
	dp.ds("rotation" , function(r){this.transform._checkVals(); this.transform._rotationZ = r; this.transform._mdirty = true;});
	dp.dg("rotationX", function( ){this.transform._checkVals(); return this.transform._rotationX;});
	dp.dg("rotationY", function( ){this.transform._checkVals(); return this.transform._rotationY;});
	dp.dg("rotationZ", function( ){this.transform._checkVals(); return this.transform._rotationZ;});
	dp.dg("rotation" , function( ){this.transform._checkVals(); return this.transform._rotationZ;});
	
	
	dp.ds("alpha", function(a){ this.transform._cmat[15] = a; this.transform._checkColorID(); });
	dp.dg("alpha", function( ){ return this.transform._cmat[15]; });
	
	
	dp.dg("mouseX", function(){return this._getMouse()[0];});
	dp.dg("mouseY", function(){return this._getMouse()[1];});
	
	delete(dp.ds);
	delete(dp.dg);
	delete(this.dp);
	
