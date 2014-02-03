		/**
		 * Set the text format of a text
		 * @param ntf	new text format
		 */
	function TextField()
	{
		InteractiveObject.call(this);
		
		
		this._wordWrap	= false;	// wrap words 
		this._textW		= 0;		// width of text
		this._textH		= 0;		// height of text
		this._areaW		= 100;		// width of whole TF area
		this._areaH		= 100;		// height of whole TF area
		this._text		= "";		// current text
		this._tForm		= new TextFormat();
		this._rwidth	= 0;
		this._rheight	= 0;
		
		this._texture	= gl.createTexture();	// texture
		this._tcArray	= new Float32Array([0,0, 0,0, 0,0, 0,0]);
		this._tcBuffer	= gl.createBuffer();	// texture coordinates buffer
		Stage._setBF(this._tcBuffer);
		//gl.bindBuffer(gl.ARRAY_BUFFER, this._tcBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this._tcArray, gl.STATIC_DRAW);
		
		this._fArray	= new Float32Array([0,0,0, 0,0,0, 0,0,0, 0,0,0]);
		this._vBuffer	= gl.createBuffer();	// vertices buffer for 4 vertices
		Stage._setBF(this._vBuffer);
		//gl.bindBuffer(gl.ARRAY_BUFFER, this._vBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this._fArray, gl.STATIC_DRAW);
		
		this._brect.x = this._brect.y = 0;
	}
	TextField.prototype = new InteractiveObject();
	
	/* public */
	
	TextField.prototype.setTextFormat = function(ntf)
	{
		this._tForm.set(ntf);
		this._update();
	}
	
	TextField.prototype.getTextFormat = function(ntf)
	{
		return this._tForm.clone();
	}
	
	TextField.prototype._update = function()
	{
		var w = this._brect.width  = this._areaW;
		var h = this._brect.height = this._areaH;
		
		if(w == 0 || h == 0) return;
		var data = this._tForm.getImageData(this._text, this);
		this._textW = data.tw;
		this._textH = data.th;
		
		if(data.rw != this._rwidth || data.rh != this._rheight) 
		{
			gl.deleteTexture(this._texture);
			this._texture = gl.createTexture();
		}
		Stage._setTEX(this._texture);
		//gl.bindTexture(gl.TEXTURE_2D, this._texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data.image);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);  
		gl.generateMipmap(gl.TEXTURE_2D); 
		
		this._rwidth = data.rw;
		this._rheight = data.rh;
		
		var sx = w / data.rw;
		var sy = h / data.rh;
		
		var ta = this._tcArray;
		ta[2] = ta[6] = sx;
		ta[5] = ta[7] = sy;
		
		Stage._setBF(this._tcBuffer);
		//gl.bindBuffer(gl.ARRAY_BUFFER, this._tcBuffer);
		gl.vertexAttribPointer(Stage._main._sprg.tca, 2, gl.FLOAT, false, 0, 0);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, ta);
		
		var fa = this._fArray;
		fa[3] = fa[9] = w;
		fa[7] = fa[10] = h;
		Stage._setBF(this._vBuffer);
		//gl.bindBuffer(gl.ARRAY_BUFFER, this._vBuffer);
		gl.vertexAttribPointer(Stage._main._sprg.vpa, 3, gl.FLOAT, false, 0, 0);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, fa);
	}

	TextField.prototype._render = function(st)
	{
		if(this._areaW == 0 || this._areaH == 0) return;
		
		gl.uniformMatrix4fv(st._sprg.tMatUniform, false, st._mstack.top());
		st._cmstack.update();
		
		Stage._setVC(this._vBuffer);
		Stage._setTC(this._tcBuffer);
		Stage._setUT(1);
		Stage._setTEX(this._texture);
		Stage._setEBF(st._unitIBuffer);
		
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
	}
	
	this.tp = TextField.prototype;
	tp.ds = tp.__defineSetter__;
	tp.dg = tp.__defineGetter__;
	
	tp.dg("textWidth" , function(){return this._textW;});
	tp.dg("textHeight", function(){return this._textH;});
	
	tp.ds("wordWrap", function(x){this._wordWrap = x; this._update();});
	tp.dg("wordWrap", function( ){return this._wordWrap;});
	
	tp.ds("width" , function(x){this._areaW = Math.max(0,x); this._update();});
	tp.dg("width" , function( ){return this._areaW;});
	
	tp.ds("height", function(x){this._areaH = Math.max(0,x);; this._update();});
	tp.dg("height", function( ){return this._areaH;});
	
	tp.ds("text", function(x){this._text = x.toString(); this._update();});
	tp.dg("text", function( ){return this._text;});
	
	delete(tp.ds);
	delete(tp.dg);
	delete(this.tp);
	

