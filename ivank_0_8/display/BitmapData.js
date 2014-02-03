
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














