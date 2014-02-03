

	var BlendMode = 
	{
		NORMAL		: "normal",
		ADD			: "add",
		SUBTRACT	: "subtract",
		MULTIPLY	: "multiply",
		SCREEN		: "screen",
		
		ERASE		: "erase",
		ALPHA		: "alpha"
	}
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
	

		function InteractiveObject()
		{
			DisplayObject.call(this);
			
			this.buttonMode = false;
			this.mouseEnabled = true;
		}
		InteractiveObject.prototype = new DisplayObject();
		
		
		InteractiveObject.prototype._moveMouse = function(nx, ny, chColl)
		{
			if(!chColl || !this.visible || !this.mouseEnabled) return null;
			
			var r = this._getRect();
			if(r == null) return null;
			
			var t = this._temp;
			t[0] = nx; t[1] = ny;
			Point._m4.multiplyVec2(this.transform._getIMat(), t, t);
			if(r.contains(t[0], t[1])) return this;
			return null;
		}
		
	/** 
	 * A basic container class in the Display API
	 * 
	 * @author Ivan Kuckir
	 * @version 1.0
	 */
	function DisplayObjectContainer()
	{	
		InteractiveObject.call(this);
	
		this.numChildren = 0;
		this.mouseChildren = true;
		
		this._children = [];
		this._brect2 = new Rectangle(0,0,0,0);
	}
	DisplayObjectContainer.prototype = new InteractiveObject();
	
	
	/**
	 * Adds a child to the container
	 * 
	 * @param o	a chil object to be added
	 */
	DisplayObjectContainer.prototype.addChild = function(o)
	{
		this._children.push(o);
		o.parent = this;
		o._setStage(this.stage);
		++ this.numChildren;
	}
	
	/**
	 * Removes a child from the container
	 * 
	 * @param o	a child object to be removed
	 */
	DisplayObjectContainer.prototype.removeChild = function(o)
	{
		var ind = this._children.indexOf(o);
		if(ind<0) return;
		this._children.splice(ind, 1);
		o.parent = null;
		o._setStage(null);
		-- this.numChildren;
	}
	
	DisplayObjectContainer.prototype.removeChildAt = function(i)
	{
		this.removeChild(this._children[i]);
	}
	
	/**
	 * Checks, if a container contains a certain child
	 * 
	 * @param o	an object for which we check, if it is contained or not
	 * @return	true if contains, false if not
	 */
	DisplayObjectContainer.prototype.contains = function(o)
	{
		return (this._children.indexOf(o)>=0);
	}
	
	DisplayObjectContainer.prototype.getChildIndex = function(o)
	{
		return this._children.indexOf(o);
	}
	
	/**
	 * Sets the child index in the current children list.
	 * Child index represents a "depth" - an order, in which children are rendered
	 * 
	 * @param c1	a child object
	 * @param i2	a new depth value
	 */
	DisplayObjectContainer.prototype.setChildIndex = function(c1, i2)
	{
		var i1 = this._children.indexOf(c1);
		
		if(i2>i1) 
		{
			for(var i= i1+1; i<= i2; i++) this._children[i-1] = this._children[i];
			this._children[i2] = c1;
		}
		else if(i2<i1) 
		{
			for(var i= i1-1; i>= i2; i--) this._children[i+1] = this._children[i];
			this._children[i2] = c1;
		}
	}
	
	
	/**
	 * Returns the child display object instance that exists at the specified index.
	 * 
	 * @param i	index (depth)
	 * @return	an object at this index
	 */
	DisplayObjectContainer.prototype.getChildAt = function(i)
	{
		return this._children[i];
	}
	
	
	DisplayObjectContainer.prototype._render = function(st)
	{
		for(var i=0; i<this.numChildren; i++) this._children[i]._renderAll(st);
	}
	
	
	
	DisplayObjectContainer.prototype._moveMouse = function(nx, ny, chColl)
	{
		if(!chColl || !this.visible || (!this.mouseChildren && !this.mouseEnabled)) return null;
		var t = this._temp;
		t[0] = nx; t[1] = ny;
		Point._m4.multiplyVec2(this.transform._getIMat(), t, t);
		
		var mx = t[0], my = t[1];
		
		var chc = chColl;
		var topTGT = null;
		var n = this.numChildren - 1;
		
		for(var i=n; i>-1; i--) 
		{
			var ntg = this._children[i]._moveMouse(mx, my, chc);
			if(ntg != null) {topTGT = ntg;  break;}
		}
		if(!this.mouseChildren && topTGT != null) return this;
		return topTGT;
	}
	
		/*
		Check, whether object hits pt[0], pt[1] in parent coordinate system
	*/
	
	DisplayObjectContainer.prototype._htpLocal = function(pt)
	{
		var t = this._temp;
		Point._m4.multiplyVec2(this.transform._getIMat(), pt, t);
		
		var n = this._children.length;
		for(var i=0; i<n; i++)
		{
			var ch = this._children[i];
			if(ch.visible) if(ch._htpLocal(t)) return true;
		}
		return false;
	}
	
	DisplayObjectContainer.prototype._setStage = function(st)
	{
		InteractiveObject.prototype._setStage.call(this, st);
		for(var i=0; i<this.numChildren; i++) this._children[i]._setStage(st);
	}
	
	DisplayObjectContainer.prototype._getRect = function(stks)
	{
		if(this.numChildren == 0) return null;
		
		var r = null;
		var r2 = this._brect2;
		
		for(var i=0; i<this.numChildren; i++)
		{
			var ch = this._children[i];
			var cr = ch._getRect(stks);
			if(!ch.visible || cr == null) continue;
			if(r == null){r = this._brect; r._setAndTransform(cr, ch.transform._getTMat());}
			else{ r2._setAndTransform(cr, ch.transform._getTMat()); r._unionWith(r2);}
		}
		return r;
	}
	
	

	function BitmapData(imgURL)
	{
		// public
		this.width = 0;							// size of texture
		this.height = 0;
		this.rect = null;						// real BD height
		this.loader = new EventDispatcher();
		this.loader.bytesLoaded = 0;
		this.loader.bytesTotal = 0;
		
		// private
		this._img = null;
		this._texture = gl.createTexture();
		this._rwidth = 0;						// real size of bitmap in memory (power of two)
		this._rheight = 0;
		this._tcBuffer = gl.createBuffer();		//	texture coordinates buffer
		this._vBuffer  = gl.createBuffer();		//	four vertices of bitmap
		this._loaded = false;
		
		this._opEv = new Event(Event.OPEN);
		this._pgEv = new Event(Event.PROGRESS);
		this._cpEv = new Event(Event.COMPLETE);
		
		this._opEv.target = this._pgEv.target = this._cpEv.target = this.loader;
		
		if(imgURL == null) return;
		
		this._img = document.createElement("img");
		var bd = this, img = this._img;
		this._img.onload		= function(e){ bd._initFromImg(img, img.width, img.height); bd.loader.dispatchEvent(bd._cpEv);};
		this._img.src = imgURL;
	}
	
	/* public */
	
	BitmapData.empty = function(w, h)
	{
		var bd = new BitmapData(null);
		bd._initFromImg(null, w, h);
		return bd;
	}
	
	BitmapData.prototype.setPixels = function(r, buff)
	{
		Stage._setTEX(this._texture);
		gl.texSubImage2D(gl.TEXTURE_2D, 0, r.x, r.y, r.width, r.height,  gl.RGBA, gl.UNSIGNED_BYTE, buff);
		gl.generateMipmap(gl.TEXTURE_2D);
	}
	
	BitmapData.prototype.getPixels = function(r, buff)
	{
		if(!buff) buff = new Uint8Array(r.width * r.height * 4);
		this._setTexAsFB();
		gl.readPixels(r.x, r.y, r.width, r.height, gl.RGBA, gl.UNSIGNED_BYTE, buff);
		Stage._main._setFramebuffer(null, Stage._main.stageWidth, Stage._main.stageHeight, false);
		return buff;
	}
	
	BitmapData.prototype.draw = function(dobj)
	{
		this._setTexAsFB();
		dobj._render(Stage._main);
		Stage._main._setFramebuffer(null, Stage._main.stageWidth, Stage._main.stageHeight, false);
		
		Stage._setTEX(this._texture);
		gl.generateMipmap(gl.TEXTURE_2D); 
		
	}
	
	/* private */
	
	BitmapData.prototype._setTexAsFB = function()
	{
		if(BitmapData._fbo == null)
		{
			BitmapData._fbo = gl.createFramebuffer();
			var rbo = gl.createRenderbuffer();
			gl.bindRenderbuffer(gl.RENDERBUFFER, rbo);
			gl.bindFramebuffer(gl.FRAMEBUFFER, BitmapData._fbo);
			gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rbo);
		}
		
		Stage._main._setFramebuffer(BitmapData._fbo, this._rwidth, this._rheight, true);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._texture, 0);
	}
	
	BitmapData.prototype._initFromImg = function(img, w, h)
	{
		this._loaded = true;
		this.width = w;			// image width
		this.height = h;		// image.height
		this._rwidth = BitmapData._nhpot(w);	// width - power of Two
		this._rheight = BitmapData._nhpot(h);	// height - power of Two
		this.rect = new Rectangle(0,0,w,h);
		
		var xsc = w/this._rwidth;
		var ysc = h/this._rheight;
		
		Stage._setBF(this._tcBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0, xsc,0, 0,ysc, xsc,ysc]), gl.STATIC_DRAW);
	
		Stage._setBF(this._vBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0,0, w,0,0, 0,h,0, w,h,0]), gl.STATIC_DRAW);
		
		var canv = BitmapData._canv;
		canv.width = this._rwidth;
		canv.height = this._rheight;
		var ctx = BitmapData._ctx;
		if(img != null) ctx.drawImage(img, 0, 0);

		var data = ctx.getImageData(0, 0, this._rwidth, this._rheight);
		
		Stage._setTEX(this._texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);	
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.generateMipmap(gl.TEXTURE_2D); 
	}
	
BitmapData._canv = document.createElement("canvas");
BitmapData._ctx = BitmapData._canv.getContext("2d");

	
BitmapData._ipot = function(x) {
    return (x & (x - 1)) == 0;
}
 
BitmapData._nhpot = function(x) {
    --x;
    for (var i = 1; i < 32; i <<= 1)   x = x | x >> i;
    return x + 1;
}















	/** 
	 * A basic class for rendering bitmaps
	 * 
	 * @author Ivan Kuckir
	 * @version 1.0
	 */
	function Bitmap(bd)
	{
		DisplayObject.call(this);
		this.bitmapData = bd;
	}
	Bitmap.prototype = new InteractiveObject();		// this Bitmap is InteractiveObject !!!
	
	Bitmap.prototype._getRect = function()
	{
		return this.bitmapData.rect;
	}
	
	Bitmap.prototype._render = function(st)
	{
		//return;
		var tbd = this.bitmapData;
		if(!tbd._loaded) return;
		gl.uniformMatrix4fv(st._sprg.tMatUniform, false, st._mstack.top());
		st._cmstack.update();
		
		Stage._setVC(tbd._vBuffer);
		Stage._setTC(tbd._tcBuffer);
		Stage._setUT(1);
		Stage._setTEX(tbd._texture);
		Stage._setEBF(st._unitIBuffer);
		
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
	}

    var gl;

    function Stage(canvID) 
	{
		DisplayObjectContainer.call(this);
		document.body.style.margin="0";
		
		this.stage = this;
		
		this.stageWidth = 0;
		this.stageHeight = 0;
		
		this.focus   = null;			// keyboard focus, never Stage
		this._focii = [null, null, null];
		this._mousefocus = null;		// mouse focus of last mouse move, used to detect MOUSE_OVER / OUT, never Stage
		
		this._useHand = false;
		this._knM = false;	// know mouse
		this._mstack = new Stage._MStack();
		this._cmstack = new Stage._CMStack();
		this._sprg = null;
		
		this._pmat = Point._m4.create([
			 1, 0, 0, 0,
			 0, 1, 0, 0,
			 0, 0, 1, 1,
			 0, 0, 0, 1
		]);	// project matrix
		
		this._umat = Point._m4.create([
			 2, 0, 0, 0,
			 0,-2, 0, 0,
			 0, 0, 2, 0,
			-1, 1, 0, 1
		]);	// unit matrix
		
		this._smat = Point._m4.create([
			 0, 0, 0, 0,
			 0, 0, 0, 0,
			 0, 0, 0.001, 0,
			 0, 0, 0, 1
		]);	// scale matrix
		
		this._efEv = new Event(Event.ENTER_FRAME);
		this._rsEv = new Event(Event.RESIZE);
		
		this._mcEvs = [	new MouseEvent(MouseEvent.CLICK			,true), 
						new MouseEvent(MouseEvent.MIDDLE_CLICK	,true), 
						new MouseEvent(MouseEvent.RIGHT_CLICK	,true) ];
						
		this._mdEvs = [ new MouseEvent(MouseEvent.MOUSE_DOWN		,true),
						new MouseEvent(MouseEvent.MIDDLE_MOUSE_DOWN	,true),
						new MouseEvent(MouseEvent.RIGHT_MOUSE_DOWN	,true) ];
						
		this._muEvs = [ new MouseEvent(MouseEvent.MOUSE_UP			,true),
						new MouseEvent(MouseEvent.MIDDLE_MOUSE_UP	,true),
						new MouseEvent(MouseEvent.RIGHT_MOUSE_UP	,true) ];
		
		this._mmoEv = new MouseEvent(MouseEvent.MOUSE_MOVE,	true);
		this._movEv = new MouseEvent(MouseEvent.MOUSE_OVER,	true);
		this._mouEv = new MouseEvent(MouseEvent.MOUSE_OUT,	true);
		
		this._kdEv = new KeyboardEvent(KeyboardEvent.KEY_DOWN, true);
		this._kuEv = new KeyboardEvent(KeyboardEvent.KEY_UP, true);
		
		this._smd   = [false, false, false];
		this._smu   = [false, false, false];
		
		this._smm  = false;	// stage mouse move
		this._srs  = false;	// stage resized
		
		this._canvas = this.canvas = document.getElementById(canvID);
		
		Stage._main = this;
		
		var par = { alpha:true, antialias:true, depth:true, premultipliedAlpha:true };
		var c = this.canvas;
		gl = c.getContext("webgl", par);
		if (!gl) gl = c.getContext("experimental-webgl", par);
		if (!gl) alert("Could not initialize WebGL. Try to update your browser or graphic drivers.");
		
		//if(WebGLDebugUtils) WebGLDebugUtils.makeDebugContext(gl);
		
		c.style["-webkit-user-select"] = "none";
		
		var d = document;
		d.addEventListener("contextmenu",		Stage._ctxt, false);
		d.addEventListener("dragstart",			Stage._blck, false);
		
		if(Stage._isTD())
		{
			d.addEventListener("touchstart",	Stage._onTD, false);
			d.addEventListener("touchmove",		Stage._onTM, false);
			d.addEventListener("touchend",		Stage._onTU, false);
			d.addEventListener("touchstart",	Stage._blck, false);
			d.addEventListener("touchmove",		Stage._blck, false);
			d.addEventListener("touchend",		Stage._blck, false);
		}
		else
		{
			d.addEventListener("mousedown",		Stage._onMD, false);
			d.addEventListener("mousemove",		Stage._onMM, false);
			d.addEventListener("mouseup",		Stage._onMU, false);
			//c.addEventListener("mousedown",		Stage._blck, false);
			//c.addEventListener("mousemove",		Stage._blck, false);
			//c.addEventListener("mouseup",		Stage._blck, false);	
		}
		document.addEventListener("keydown",	Stage._onKD, false);
		document.addEventListener("keyup",		Stage._onKU, false);
		document.addEventListener("keydown",	Stage._blck, false);
		document.addEventListener("keyup",		Stage._blck, false);
		
		window.addEventListener("resize",	Stage._onRS, false);
       
        this._initShaders();
        this._initBuffers();

        gl.clearColor(0, 0, 0, 0);
		
		gl.enable(gl.BLEND);
		gl.blendEquation(gl.FUNC_ADD);		
		gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
		
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);
		
		this._resize();
		this._srs = true;
        _requestAF(Stage._tick);
    }
	Stage.prototype = new DisplayObjectContainer();
	
	Stage._mouseX = 0;
	Stage._mouseY = 0;
	
	Stage._curBF = -1;
	Stage._curEBF = -1;
	
	Stage._curVC = -1;
	Stage._curTC = -1;
	Stage._curUT = -1;
	Stage._curTEX = -1;
	
	Stage._curBMD = "normal";
	
	Stage._setBF = function(bf)
	{
		if(Stage._curBF != bf) {
			gl.bindBuffer(gl.ARRAY_BUFFER, bf);
			Stage._curBF = bf;
		}
	}
	Stage._setEBF = function(ebf)
	{
		if(Stage._curEBF != ebf) {
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebf);
			Stage._curEBF = ebf;
		}
	}
	Stage._setVC = function(vc)
	{
		if(Stage._curVC != vc) {
			gl.bindBuffer(gl.ARRAY_BUFFER, vc);
			gl.vertexAttribPointer(Stage._main._sprg.vpa, 3, gl.FLOAT, false, 0, 0);
			Stage._curVC = Stage._curBF = vc;
		}
	}
	Stage._setTC = function(tc)
	{
		if(Stage._curTC != tc) {
			gl.bindBuffer(gl.ARRAY_BUFFER, tc);
			gl.vertexAttribPointer(Stage._main._sprg.tca, 2, gl.FLOAT, false, 0, 0);
			Stage._curTC = Stage._curBF = tc;
		}
	}
	Stage._setUT = function(ut)
	{
		if(Stage._curUT != ut) {
			gl.uniform1i (Stage._main._sprg.useTex, ut);
			Stage._curUT = ut;
		}
	}
	Stage._setTEX = function(tex)
	{
		if(Stage._curTEX != tex) {
			gl.bindTexture(gl.TEXTURE_2D, tex);
			Stage._curTEX = tex;
		}
	}
	Stage._setBMD = function(bmd)
	{
		if(Stage._curBMD != bmd) 
		{
			if		(bmd == BlendMode.NORMAL  ) {
				gl.blendEquation(gl.FUNC_ADD);
				gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
			}
			else if	(bmd == BlendMode.MULTIPLY) {
				gl.blendEquation(gl.FUNC_ADD);
				gl.blendFunc(gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA);
			}
			else if	(bmd == BlendMode.ADD)	  {
				gl.blendEquation(gl.FUNC_ADD);
				gl.blendFunc(gl.ONE, gl.ONE);
			}
			else if (bmd == BlendMode.SUBTRACT) { 
				gl.blendEquationSeparate(gl.FUNC_REVERSE_SUBTRACT, gl.FUNC_ADD);
				gl.blendFunc(gl.ONE, gl.ONE); 
			}
			else if (bmd == BlendMode.SCREEN) { 
				gl.blendEquation(gl.FUNC_ADD);
				gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_COLOR);
			}
			else if (bmd == BlendMode.ERASE) { 
				gl.blendEquation(gl.FUNC_ADD);
				gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_ALPHA);
			}
			else if (bmd == BlendMode.ALPHA) {
				gl.blendEquation(gl.FUNC_ADD);
				gl.blendFunc(gl.ZERO, gl.SRC_ALPHA);
			}
			Stage._curBMD = bmd;
		}
	}
	
	Stage._okKeys = 	// keyCodes, which are not prevented by IvanK
	[	
		112, 113, 114, 115,   116, 117, 118, 119,   120, 121, 122, 123,	// F1 - F12
		13,	// Enter
		16,	// Shift
		//17,	// Ctrl
		18,	// Alt
		27	// Esc
	];
	
	/** Is Touchscreen Device */
	Stage._isTD = function() { return !!('ontouchstart' in window); }

	Stage._ctxt = function(e){ if(Stage._main.hasEventListener(MouseEvent.RIGHT_CLICK))e.preventDefault();}
	
	Stage._onTD = function(e){ Stage._setStageMouse(e); Stage._main._smd[0] = true; Stage._main._knM = true;}
	Stage._onTM = function(e){ Stage._setStageMouse(e); Stage._main._smm    = true; Stage._main._knM = true;}
	Stage._onTU = function(e){ Stage._main._smu[0] = true; Stage._main._knM = true;}
	
	Stage._onMD = function(e){ Stage._setStageMouse(e); Stage._main._smd[e.button] = true; Stage._main._knM = true;}
	Stage._onMM = function(e){ Stage._setStageMouse(e); Stage._main._smm           = true; Stage._main._knM = true;}
	Stage._onMU = function(e){ Stage._main._smu[e.button] = true; Stage._main._knM = true;}
	
	Stage._onKD = function(e)
	{
		var st = Stage._main;
		st._kdEv._setFromDom(e);
		if(st.focus && st.focus.stage) st.focus.dispatchEvent(st._kdEv); else st.dispatchEvent(st._kdEv);
	}
	Stage._onKU = function(e)
	{ 
		var st = Stage._main;
		st._kuEv._setFromDom(e);
		if(st.focus && st.focus.stage) st.focus.dispatchEvent(st._kuEv); else st.dispatchEvent(st._kuEv);
	}
	Stage._blck = function(e){ if(e.keyCode != null) {if(Stage._okKeys.indexOf(e.keyCode)==-1) e.preventDefault(); } else e.preventDefault(); }
	Stage._onRS = function(e){ Stage._main._srs = true; }
	
	Stage.prototype._resize = function()
	{
		var w = window.innerWidth;
		var h = window.innerHeight;
		
		this.stageWidth = w;
		this.stageHeight = h;
		
		this._canvas.width = w;
		this._canvas.height = h;
	
		this._setFramebuffer(null, w, h, false);
	}

    Stage.prototype._getShader = function(gl, str, fs) {
	
        var shader;
        if (fs)	shader = gl.createShader(gl.FRAGMENT_SHADER);
        else	shader = gl.createShader(gl.VERTEX_SHADER);   

        gl.shaderSource(shader, str);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    }



    Stage.prototype._initShaders = function() 
	{	
		var fs = "\
			precision mediump float;\
			varying vec2 texCoord;\
			\
			uniform sampler2D uSampler;\
			uniform vec4 color;\
			uniform bool useTex;\
			\
			uniform mat4 cMat;\
			uniform vec4 cVec;\
			\
			void main(void) {\
				vec4 c = useTex ? texture2D(uSampler, texCoord) : color;\
				c = (cMat*c)+cVec;\n\
				c.xyz *= min(c.w, 1.0);\n\
				gl_FragColor = c;\
			}";
		
		var vs = "\
			attribute vec3 verPos;\
			attribute vec2 texPos;\
			\
			uniform mat4 tMat;\
			\
			varying vec2 texCoord;\
			\
			void main(void) {\
				gl_Position = tMat * vec4(verPos, 1.0);\
				texCoord = texPos;\
			}";
			
		var fShader = this._getShader(gl, fs, true );
        var vShader = this._getShader(gl, vs, false);

        this._sprg = gl.createProgram();
        gl.attachShader(this._sprg, vShader);
        gl.attachShader(this._sprg, fShader);
        gl.linkProgram(this._sprg);

        if (!gl.getProgramParameter(this._sprg, gl.LINK_STATUS)) {
            alert("Could not initialise shaders");
        }

        gl.useProgram(this._sprg);

        this._sprg.vpa		= gl.getAttribLocation(this._sprg, "verPos");
        this._sprg.tca		= gl.getAttribLocation(this._sprg, "texPos");
        gl.enableVertexAttribArray(this._sprg.tca);
		gl.enableVertexAttribArray(this._sprg.vpa);

		this._sprg.tMatUniform		= gl.getUniformLocation(this._sprg, "tMat");
		this._sprg.cMatUniform		= gl.getUniformLocation(this._sprg, "cMat");
		this._sprg.cVecUniform		= gl.getUniformLocation(this._sprg, "cVec");
        this._sprg.samplerUniform	= gl.getUniformLocation(this._sprg, "uSampler");
		this._sprg.useTex			= gl.getUniformLocation(this._sprg, "useTex");
		this._sprg.color			= gl.getUniformLocation(this._sprg, "color");
    }

	
    Stage.prototype._initBuffers = function() 
	{
        this._unitIBuffer = gl.createBuffer();
		
		Stage._setEBF(this._unitIBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0,1,2,  1,2,3]), gl.STATIC_DRAW);
    }
	
	Stage.prototype._setFramebuffer = function(fbo, w, h, flip) 
	{
		this._mstack.clear();
		
		this._mstack.push(this._pmat, 0);
		if(flip)	{ this._umat[5] =  2; this._umat[13] = -1;}
		else		{ this._umat[5] = -2; this._umat[13] =  1;}
		this._mstack.push(this._umat);
		
		this._smat[0] = 1/w;  this._smat[5] = 1/h;
		this._mstack.push(this._smat);
	
		gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
		if(fbo) gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w,h);
		gl.viewport(0, 0, w, h);
	}
	
	Stage._setStageMouse = function(e)	// event, want X
	{
		var ev = e;
		if(e.type == "touchstart" || e.type == "touchmove" || e.type == "touchend") ev = e.touches.item(0);
		
		var mx = ev.clientX;// + document.body.scrollLeft + document.documentElement.scrollLeft;
		var my = ev.clientY;// + document.body.scrollTop  + document.documentElement.scrollTop ;
		Stage._mouseX = mx;
		Stage._mouseY = my;
	}

    Stage.prototype._drawScene = function() 
	{		
		if(this._srs)
		{
			this._resize();
			this.dispatchEvent(this._rsEv);
			this._srs = false;
		}
		
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		if(this._knM)
		{
			//	proceeding Mouse Events
			var newf = this._moveMouse(Stage._mouseX, Stage._mouseY, true);
			var fa = this._mousefocus || this, fb = newf || this;
			
			if(newf != this._mousefocus)
			{
				if(fa != this)
				{
					var ev = this._mouEv;
					ev.target = fa;
					fa.dispatchEvent(ev);
				}
				if(fb != this)
				{
					ev = this._movEv;
					ev.target = fb;
					fb.dispatchEvent(ev);
				}
			}
			
			var sd=this._smd,su=this._smu;
			for(var i=0; i<3; i++)
			{
				this._mcEvs[i].target = this._mdEvs[i].target = this._muEvs[i].target = fb;
				if(sd[i])	{fb.dispatchEvent(this._mdEvs[i]); this._focii[i] = this.focus = newf;}
				if(su[i])	{fb.dispatchEvent(this._muEvs[i]); if(newf == this._focii[i]) fb.dispatchEvent(this._mcEvs[i]); }
				sd[i]=su[i]=false;
			}
			
			this._mmoEv.target = fb;
			if(this._smm)	{fb.dispatchEvent(this._mmoEv);}
			this._smm=false;
			
			this._mousefocus = newf;
		
			//	checking buttonMode
			var uh = false, ob = fb;
			while(ob.parent != null) {uh |= ob.buttonMode; ob = ob.parent;}
			if(uh != this._useHand) this._canvas.style.cursor = uh?"pointer":"default";
			this._useHand = uh;
		}
		
		//	proceeding EnterFrame
		var efs = EventDispatcher.efbc;
		var ev = this._efEv;
		for(var i=0; i<efs.length; i++)
		{
			ev.target = efs[i];
			efs[i].dispatchEvent(ev);
		}
		
        this._renderAll(this);
    }
	


    Stage._tick = function() {
        _requestAF(Stage._tick);
        Stage.prototype._drawScene.call(Stage._main);
    }

	Stage._MStack = function()
	{
		this.mats = [];
		this.size = 1;
		for(var i=0; i<30; i++) this.mats.push(Point._m4.create());
	}
	
	Stage._MStack.prototype.clear = function()
	{
		this.size = 1;
	}

	Stage._MStack.prototype.push = function(m)
	{
		var s = this.size++;
		Point._m4.multiply(this.mats[s-1], m, this.mats[s]);
	}
	
	Stage._MStack.prototype.pop = function()
	{
		this.size--;
	}
	
	Stage._MStack.prototype.top = function()
	{
		return(this.mats[this.size-1]);
	}
	
	/*
		Color matrix stack
	*/
	Stage._CMStack = function()
	{
		this.mats = [];	//	linear transform matrix
		this.vecs = [];	//  affine shift column
		this.isID = []; //	is Identity
		
		this.bmds = []; //	blend modes
		this.lnnm = [];	//	last not NORMAL blend mode
		this.size = 1;
		this.dirty = true;	// if top matrix is different than shader value
		for(var i=0; i<30; i++) {	this.mats.push(Point._m4.create()); this.vecs.push(new Float32Array(4)); 
									this.isID.push(true); this.bmds.push(BlendMode.NORMAL); this.lnnm.push(0); }
	}
	
	Stage._CMStack.prototype.push = function(m, v, id, bmd)
	{
		var s = this.size++;
		this.isID[s] = id;
		 
		if(id) {
			Point._m4.set(this.mats[s-1], this.mats[s]);
			Point._v4.set(this.vecs[s-1], this.vecs[s]);
		}
		else
		{
			Point._m4.multiply    (this.mats[s-1], m, this.mats[s]);
			Point._m4.multiplyVec4(this.mats[s-1], v, this.vecs[s]);
			Point._v4.add	      (this.vecs[s-1], this.vecs[s], this.vecs[s]);
		}
		if(!id) this.dirty = true;
		
		this.bmds[s] = bmd;
		this.lnnm[s] = (bmd==BlendMode.NORMAL) ? this.lnnm[s-1] : s;
	}
	
	Stage._CMStack.prototype.update = function()
	{
		if(this.dirty)
		{
			var st = Stage._main, s = this.size-1;
			gl.uniformMatrix4fv(st._sprg.cMatUniform, false, this.mats[s]);
			gl.uniform4fv      (st._sprg.cVecUniform, this.vecs[s]);
			this.dirty = false;
		}
		var n = this.lnnm[this.size-1];
		Stage._setBMD(this.bmds[n]);
	}
	
	Stage._CMStack.prototype.pop = function()
	{
		if(!this.isID[this.size-1]) this.dirty = true;
		this.size--;
	}
	


	
	
	/**
	 * A basic class for vector drawing
	 * 
	 * @author Ivan Kuckir
	 */
	function Graphics()
	{
		this._px = 0;	// position of drawing pointer
		this._py = 0;
	
		this._uls	= [];		// universal lines
		this._cvs	= [];		// curves
		this._tgs	= [];		// triangles
		
		this._elems	= [];		// all the elements
		
		this._duls	= [];
		this._dcvs	= [];		// deleted curves
		this._dtgs	= {};		// deleted triangles
		
		this._minx	= Number.POSITIVE_INFINITY;
		this._miny	= this._minx;
		this._maxx	= Number.NEGATIVE_INFINITY;
		this._maxy	= this._maxx;
		
		// for strokes
		this._sminx	= Number.POSITIVE_INFINITY;
		this._sminy	= this._sminx;
		this._smaxx	= Number.NEGATIVE_INFINITY;
		this._smaxy	= this._smaxx;
		
		this._brect	= new Rectangle(0,0,0,0);
		
		this._clstyle	= new LineStyle(1, 0x000000, 1);	// current line style
		this._cfstyle	= new FillStyle(0xff0000, 1);		// current fill style
		this._bdata		= null;
	
		this._ftype	= 0;		// fill type, 0-color, 1-bitmap
		this._empty	= true;
		
		/* drawing lines */
		this._lvbuf = gl ? gl.createBuffer() : null;
		this._lvval = new Float32Array(18);				// line vertex values
		this._lused = 0;
		this._ltotal = 1;
		this._ldirty = false;
		this._lsegment = null;
		if(gl) this._sendLBuffers();
	}
	
	/**
	 * Renders a vector content
	 */
	Graphics.prototype._render = function(st)
	{
		gl.uniformMatrix4fv(st._sprg.tMatUniform, false, st._mstack.top());
		st._cmstack.update();
		
		if(this._ldirty)
		{
			Stage._setBF(this._lvbuf);
			gl.bufferSubData(gl.ARRAY_BUFFER, 0, this._lvval);
			this._ldirty = false;
		}
		
		var ar = this._elems;
		for(var i=0; i<ar.length; i++) ar[i].render(st);
	}
	
	Graphics.prototype._sendLBuffers = function()
	{
		Stage._setBF(this._lvbuf);
		gl.bufferData(gl.ARRAY_BUFFER, this._lvval, gl.STATIC_DRAW);
	}
	
	Graphics.prototype._newLineSegment = function()
	{
		var nls;
		if(this._duls.length == 0)
			nls = new ULSegment(this._lused, this._clstyle.colARR, this._lvbuf);
		else
		{
			nls = this._duls.pop();
			nls.update(this._lused, this._clstyle.colARR);
		}
		this._uls.push(nls);
		this._elems.push(nls);
		return nls;
	}
	
	Graphics.prototype._checkLineAvail = function(n)
	{
		var lt = this._ltotal;
		if(lt - this._lused < n)
		{
			lt = Math.max(lt+n, 2*lt);
			var oldv = this._lvval;
			var newv = new Float32Array(18*lt);
			for(var i=0; i<oldv.length; i++) newv[i] = oldv[i];
			this._ltotal = lt;
			this._lvval = newv;
			this._sendLBuffers();
		}
	}
	
	Graphics.prototype._putLine = function(x1, y1, x2, y2)	// each line: 4 points = 8 floats
	{
		this._updateSBounds(x1, y1);
		this._updateSBounds(x2, y2);
	
		if(this._lsegment == null) this._lsegment = this._newLineSegment();
		
		this._checkLineAvail(1);
		
		var il = 0.5*this._clstyle.thickness/this.len(x1-x2, y1-y2);
		var dx =  il*(y1-y2);
		var dy = -il*(x1-x2);
		
		var ps = this._lvval;
		var vi = this._lused * 18;
		ps[vi++ ] = x1+dx;	ps[vi++ ] = y1+dy;	vi++;
		
		ps[vi++ ] = x1-dx;	ps[vi++ ] = y1-dy;	vi++;
		ps[vi++ ] = x2+dx;	ps[vi++ ] = y2+dy;	vi++;
		
		ps[vi++ ] = x1-dx;	ps[vi++ ] = y1-dy;	vi++;
		ps[vi++ ] = x2+dx;	ps[vi++ ] = y2+dy;	vi++;
		
		ps[vi++ ] = x2-dx;	ps[vi++ ] = y2-dy;	vi++;
		
		this._ldirty = true;
		this._lused++;
		this._lsegment.count++;
		this._empty = false;
	}
		
	/**
	 * Set a line style
	 * @param thickness	line thickness
	 * @param color		line color
	 */
	Graphics.prototype.lineStyle = function(thickness, color, alpha)
	{
		if(!color) color = 0x000000;
		if(!alpha) alpha = 1;
		if(color != this._clstyle.color || alpha != this._clstyle.alpha)
			this._lsegment = null;
		this._clstyle.Set(thickness, color, alpha);
	}
		
	/**
	 * Begin to fill some shape
	 * @param color	color
	 */
	Graphics.prototype.beginFill = function(color, alpha)
	{
		this._ftype = 0;
		if(!alpha) alpha = 1;
		this._cfstyle.Set(color, alpha);
	}
	
	Graphics.prototype.beginBitmapFill = function(bdata)
	{
		this._ftype = 1;
		this._bdata = bdata;
	}
		
	/**
	 * End filling some shape
	 */
	Graphics.prototype.endFill = function() { }
		
	/**
	 * Move a "drawing brush" to some position
	 * @param x
	 * @param y
	 */
	Graphics.prototype.moveTo = function(x, y)
	{
		this._px = x;  this._py = y;
	}
		
	/**
	 * Draw a line to some position
	 * @param x
	 * @param y
	 */
	Graphics.prototype.lineTo = function(x2, y2)
	{
		this._putLine(this._px, this._py, x2, y2);
		this._px = x2;	this._py = y2;
	}
	
	Graphics.prototype.len = function(x, y)
	{
		return Math.sqrt(x*x+y*y);
	}
	
	Graphics.prototype.curveTo = function(bx, by, cx, cy)
	{
		var ax = this._px, ay = this._py, t = 0.666666;
		this.cubicCurveTo(ax+t*(bx-ax), ay+t*(by-ay), cx+t*(bx-cx), cy+t*(by-cy), cx, cy);
	}
	
	Graphics.prototype.cubicCurveTo = function(bx, by, cx, cy, dx, dy)
	{
		this._checkLineAvail(40);
		if(this._lsegment == null) this._lsegment = this._newLineSegment();
		/*
				b --- q --- c
			   / 			 \
			  p				  r
			 /				   \
			a					d
		*/
		var ax, ay, px, py, qx, qy, rx, ry, sx, sy, tx, ty,
			tobx, toby, tocx, tocy, todx, tody, toqx, toqy, torx, tory, totx, toty;
		var rad = 0.5*this._clstyle.thickness;
		var il, dix, diy, x, y;
		
		ax   = this._px;  ay   = this._py;
		tobx = bx - ax;  toby = by - ay;  // directions
		tocx = cx - bx;  tocy = cy - by;
		todx = dx - cx;  tody = dy - cy;
		step = 1/40;
		
		var prevx, prevy, prevdx, prevdy;
		var ps = this._lvval;
		var vi = this._lused * 18;
		
		for(var i=0; i<41; i++)
		{
			var d = i*step;
			px = ax +d*tobx;  py = ay +d*toby;
			qx = bx +d*tocx;  qy = by +d*tocy;
			rx = cx +d*todx;  ry = cy +d*tody;
			toqx = qx - px;	  toqy = qy - py;
			torx = rx - qx;	  tory = ry - qy;
			
			sx = px +d*toqx;  sy = py +d*toqy;
			tx = qx +d*torx;  ty = qy +d*tory;
			totx = tx - sx;   toty = ty - sy;

			x = sx + d*totx;  y = sy + d*toty;
			
			il = rad/this.len(totx, toty);
			dix =   il*(toty); diy =  -il*(totx);
			this._updateSBounds(x, y);
			
			if(i>0) 
			{
				ps[vi++] = prevx+prevdx;	ps[vi++] = prevy+prevdy;	vi++;
				ps[vi++] = prevx-prevdx;	ps[vi++] = prevy-prevdy;	vi++;
				ps[vi++] = x+dix;			ps[vi++] = y+diy;			vi++;
				ps[vi++] = prevx-prevdx;	ps[vi++] = prevy-prevdy;	vi++;
				ps[vi++] = x+dix;			ps[vi++] = y+diy;			vi++;
				ps[vi++] = x-dix;			ps[vi++] = y-diy;			vi++;
			}
			prevx = x;  prevy = y;  prevdx = dix;  prevdy = diy;
		}
		
		this._px = dx; this._py = dy;
		
		this._ldirty = true;
		this._lused += 40;
		this._lsegment.count += 40;
		this._empty = false;
	}
		
	/**
	 * Draw a circle
	 * @param x		X coordinate of a center
	 * @param y		Y coordinate of a center
	 * @param r		radius
	 */
	Graphics.prototype.drawCircle = function(x, y, r)
	{
		this.drawEllipse(x, y, r*2, r*2);
	}
	
	/**
	 * Draw an ellipse
	 * @param x		X coordinate of a center
	 * @param y		Y coordinate of a center
	 * @param w		ellipse width
	 * @param h		ellipse height
	 */
	Graphics.prototype.drawEllipse = function(x, y, w, h)	
	{
		var d = Math.PI/16;
		var hw = w*0.5;
		var hh = h*0.5;
		
		var vrt = Graphics._eVrt;
		
		var j = 0;
		for(var i=0; i<2*Math.PI; i+=d)
		{
			vrt[j++] = x+Math.cos(i)*hw;
			vrt[j++] = y+Math.sin(i)*hh;
		}
		this.drawTriangles(vrt, Graphics._eInd);
	}
		
	/**
	 * Draws a rectangle
	 * @param x		X coordinate of top left corner
	 * @param y		Y coordinate of top left corner
	 * @param w		width
	 * @param h		height
	 */
	Graphics.prototype.drawRect = function(x, y, w, h)
	{
		var v = Graphics._rVrt;
		v[0] = v[4] = x;
		v[1] = v[3] = y;
		v[2] = v[6] = x+w;
		v[5] = v[7] = y+h;
		this.drawTriangles(v, Graphics._rInd);
	}
	
	/**
	 * Draws a rectangle with round corners
	 * @param x		X coordinate of top left corner
	 * @param y		Y coordinate of top left corner
	 * @param w		width
	 * @param h		height
	 */
	Graphics.prototype.drawRoundRect = function(x, y, w, h, ew, eh)
	{
		var v = Graphics._rrVrt;
		var d = Math.PI/14;
		if(!eh) eh = ew;
		var hw = ew*0.5;
		var hh = eh*0.5;
		
		var j = 0;
		var cx = x+hw;
		var cy = y+hh;
		for(var i=-Math.PI; i<=Math.PI; i+=d)
		{
			if(j==16) cx += w - ew;
			if(j==32) cy += h - eh;
			if(j==48) cx -= w - ew;
			if(j>0 && (j&15)==0) i -= d;
			v[j++] = cx+Math.cos(i)*hw;
			v[j++] = cy+Math.sin(i)*hh;
		}
		this.drawTriangles(v, Graphics._rrInd);
	}
	
	Graphics.prototype.drawTriangles = function(vrt, ind, uvt)
	{
		this._drawTGS(vrt, ind, uvt, 2);
	}
	
	Graphics.prototype.drawTriangles3D = function(vrt, ind, uvt)
	{
		this._drawTGS(vrt, ind, uvt, 3);
	}
	
	// vertices, indices, texture coordinates, dimesnion
	
	Graphics.prototype._drawTGS = function(vrt, ind, uvt, d)
	{
		this._lsegment = null;
		var vnum = Math.floor(vrt.length/d);
		var tnum = Math.floor(ind.length/3)
	
		var key = vnum + "-" + tnum;
		var t;
		
		// any triangles to recycle? 
		var trgs = this._dtgs[key];
		
		if(trgs && trgs.length > 0)	t = trgs.pop();
		else 						t = new UTgs(vnum, tnum);
		
		var j = 0;
		if(d==2)
			for(var i=0; i<vrt.length; i+=2)
			{
				var x = vrt[i];  var y = vrt[i+1];
				t.vrt[j++] = x;  t.vrt[j++] = y;  j++; 
				this._updateBounds(x, y);
			}
		if(d==3)
			for(var i=0; i<vrt.length; i+=3)
			{
				var x = vrt[i];  var y = vrt[i+1];  var z = vrt[i+2];
				t.vrt[j++] = x;  t.vrt[j++] = y;  t.vrt[j++] = z; 
				this._updateBounds(x, y);
			}
			
		if(this._ftype == 1)
		{
			if(uvt != null) for(var i=0; i<uvt.length; i++ )  t.uvt[i] = uvt[i];
			else t.emptyUVT = true;
			t.dirtyUVT = true;
		}
		
		for(var i=0; i<ind.length; i++) t.ind[i] = ind[i];
		
		if(this._ftype == 1) {t.useTex = true;  t._bdata = this._bdata; 		 }
		else				 {t.useTex = false; t.SetColor(this._cfstyle.colARR);}
		t.updateData();
	
		this._tgs.push(t);
		this._elems.push(t);
		this._empty = false;
	}
		
	/**
	 * Clears all the graphic content
	 */
	Graphics.prototype.clear = function()
	{
		this._duls	= this._uls;
		this._dcvs	= this._cvs;
		
		for(var i=0; i<this._tgs.length; i++)
		{
			var t = this._tgs[i];
			if(this._dtgs[t.key] == null) this._dtgs[t.key] = [];
			this._dtgs[t.key].push(t);
		}
		
		this._uls	= [];
		this._cvs	= [];
		this._tgs	= [];
		this._elems	= [];
		
		this._ftype	= 0;
		this._empty	= true;
		
		this._minx	= this._sminx = this._miny	= this._sminy = Number.POSITIVE_INFINITY;
		this._maxx	= this._smaxx = this._maxy	= this._smaxy = Number.NEGATIVE_INFINITY;
		
		this._lused = 0;
		this._lsegment = null;
	}
		
		/**
		 * Returns a bounding rectangle of a vector content
		 * @return	a bounding rectangle
		 */
		 
	Graphics.prototype._getRect = function(stks)
	{
		if(this._empty) return null;
		var anyt = this._tgs.length != 0;
		var anys = (this._uls.length != 0 || this._cvs.length != 0);
		if(!stks && !anyt) return null;
		
		var b = this._brect;
		
		var sminx = this._sminx, sminy = this._sminy, smaxx = this._smaxx, smaxy = this._smaxy;
		if(anyt)
		{
			b._setP(this._minx, this._miny);
			b._unionWP(this._maxx, this._maxy);
			if(anys && stks) {b._unionWP(sminx, sminy); b._unionWP(smaxx, smaxy);}
			return b;
		}
		b._setP(sminx, sminy);
		b._unionWP(smaxx, smaxy);
		return b;
	}
	
	Graphics.prototype._hits = function(x, y)
	{
		if(this._empty) return false;
		if (x<this._minx || x > this._maxx || y < this._miny || y > this._maxy) return false;
		return true;
		/*
		var tnum = this._tgs.length;
		if(tnum == 1) return true;
		for(var i=0; i<tnum; i++) if(this._tgs[i]._hits(x,y)) return true;
		return false;
		*/
	}
	
	Graphics.prototype._updateBounds = function(x, y)
	{
		x<this._minx ? this._minx=x : (x>this._maxx ? this._maxx=x:0);	// evil code
		y<this._miny ? this._miny=y : (y>this._maxy ? this._maxy=y:0);	// evil code
	}
	
	Graphics.prototype._updateSBounds = function(x, y)
	{
		x<this._sminx ? this._sminx=x : (x>this._smaxx ? this._smaxx=x:0);	// evil code
		y<this._sminy ? this._sminy=y : (y>this._smaxy ? this._smaxy=y:0);	// evil code
	}
	
	Graphics._makeConvexInd = function(n)
	{
		var arr = [];
		for(var i=1; i<n-1; i++) arr.push(0, i, i+1);
		return arr;
	}
	
	Graphics._rVrt = [0,0, 0,0, 0,0, 0,0];
	Graphics._rInd = [0,1,2, 1,2,3];
	
	Graphics._eVrt = [];  for(var i=0; i<32; i++) Graphics._eVrt.push(0,0);
	Graphics._eInd = Graphics._makeConvexInd(32);
	
	Graphics._rrVrt= [];  for(var i=0; i<32; i++) Graphics._rrVrt.push(0,0);
	Graphics._rrInd = Graphics._makeConvexInd(32);
	
	/**
		Universal line segment.
	*/
	
	function ULSegment(off, c, vb)
	{
		this.vbuf	= vb;
		this.offset	= 0;
		this.count	= 0;
		this.color	= new Float32Array(4);	
		this.update(off, c);
	}
	
	ULSegment.prototype.update = function(off, col)
	{
		this.count = 0;
		this.offset = off;
		var c = this.color;
		c[0]=col[0]; c[1]=col[1]; c[2]=col[2]; c[3]=col[3];
	}
	
	ULSegment.prototype.render = function(st)
	{
		Stage._setUT(0);
		//gl.uniform1i (st._sprg.useTex, 0);
		gl.uniform4fv(st._sprg.color, this.color);
		
		Stage._setVC(this.vbuf);
		Stage._setTC(this.vbuf);
		
		gl.drawArrays(gl.TRIANGLES, 6*this.offset, 6*this.count);
	}
	
	
	/**
	 * A class for internal representation of a Triangle soup
	 */
	
	function UTgs(vnum, tnum)	// number of vertices, number of triangles
	{
		// Key:  NUM_OF_VERTICES-NUM_OF_TRIANGLES
		this.key = vnum + "-" + tnum;
		this.vrt = new Float32Array(3*vnum);
		this.ind = new Uint16Array(3*tnum);
		this.uvt = new Float32Array(2*vnum);
		
		this.useTex = false;
		this.dirtyUVT = false;	// UVT needs to be edited / scaled
		this.emptyUVT = false;	// drawing with texture & no UVT					- need to fill UVT
		this.color = new Float32Array(4);
		this._bdata = null;
		
		this.vbuf = gl.createBuffer();
		Stage._setBF(this.vbuf);
		gl.bufferData(gl.ARRAY_BUFFER, this.vrt, gl.STATIC_DRAW);
		
		this.ibuf = gl.createBuffer();
		Stage._setEBF(this.ibuf);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.ind, gl.STATIC_DRAW);
		
		this.tbuf = gl.createBuffer();
		Stage._setBF(this.tbuf);
		gl.bufferData(gl.ARRAY_BUFFER, this.uvt, gl.STATIC_DRAW);
	}
	UTgs.prototype.SetColor = function(col)
	{
		var c = this.color; c[0]=col[0]; c[1]=col[1]; c[2]=col[2]; c[3]=col[3];
	}
	UTgs.prototype._hits = function(x, y)
	{
		return (x>this._minx && x < this._maxx && y>this._miny && y< this._maxy);
	}
	
	UTgs.prototype.updateData = function()
	{
		Stage._setBF(this.vbuf);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vrt);
		
		Stage._setEBF(this.ibuf);
		gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, this.ind);
		
		Stage._setBF(this.tbuf);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.uvt);
	}
	
	UTgs.prototype.render = function(st)
	{
		//return;
		if(this.useTex)
		{
			var bd = this._bdata;
			if(bd._loaded == false) return;
			if(this.dirtyUVT)
			{
				this.dirtyUVT = false;
				if(this.emptyUVT)
				{
					this.emptyUVT = false;
					var cw = 1/bd._rwidth, ch = 1/bd._rheight;
					for(var i=0; i<this.uvt.length; i++) {this.uvt[2*i] = cw*this.vrt[3*i]; this.uvt[2*i+1] = ch*this.vrt[3*i+1];}
				}
				else if(bd.width != bd._rwidth || bd.height != bd._rheight)
				{
					var cw = bd.width/bd._rwidth, ch = bd.height/bd._rheight;
					for(var i=0; i<this.uvt.length; i++) {this.uvt[2*i] *= cw; this.uvt[2*i+1] *= ch; }
				}
				this.updateData();
			}
			Stage._setUT(1);
			Stage._setTEX(bd._texture);
			
		}
		else
		{
			Stage._setUT(0);
			gl.uniform4fv(st._sprg.color, this.color);
		}
		
		Stage._setTC(this.tbuf);
		Stage._setVC(this.vbuf);
		Stage._setEBF(this.ibuf);
		
		gl.drawElements(gl.TRIANGLES, this.ind.length, gl.UNSIGNED_SHORT, 0);	// druhý parametr - poèet indexù
		
	}
	UTgs.prototype.clear = function()
	{
		gl.deleteBuffer(this.vbuf);
		gl.deleteBuffer(this.ibuf);
		gl.deleteBuffer(this.tbuf);
	}
	
	/**
	 * A class for internal representation of a fill style
	 */
	function FillStyle(c, a)
	{
		this.color = 0x000000;
		this.alpha = 1.0;
		this.colARR = new Float32Array(4);
		this.Set(c, a);
	}
	FillStyle.prototype.Set = function(c, a)
	{
		this.color = c;
		this.alpha = a;
		var col = this.colARR;
		col[0] = (c>>16 & 255)*0.0039215686;
		col[1] = (c>>8 & 255)*0.0039215686;
		col[2] = (c & 255)*0.0039215686;
		col[3] = a;
	}
	
	/**
	 * A class for internal representation of a line style
	 */	 
	function LineStyle(th, c, a)
	{
		FillStyle.call(this);
		this.color = c;
		this.alpha = a;
		this.thickness = th;
		this.Set(th, c, a);
	}
	LineStyle.prototype = new FillStyle();
	
	LineStyle.prototype.Set = function(th, c, a)
	{
		this.thickness = th;
		FillStyle.prototype.Set.call(this, c, a);
	}
	
	
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