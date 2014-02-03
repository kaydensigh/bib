
	var TextFormatAlign = 
	{
		LEFT	: "left",
		CENTER	: "center",
		RIGHT	: "right",
		JUSTIFY	: "justify"
	}
			/**
		 * A constructor of text format
		 * @param f		URL of font
		 * @param s		size of text
		 * @param c		color of text
		 */
	function TextFormat(f, s, c, b, i, a, l)
	{
		/* public */
		this.font	= f?f:"Times new Roman";
		this.size	= s?s:12;
		this.color	= c?c:0x000000;
		this.bold	= b?b:false;
		this.italic	= i?i:false;
		this.align	= a?a:TextFormatAlign.LEFT;
		this.leading= l?l:0;
		
		this.maxW = 0;
		this.data = {image:null, tw:0, th:0, rw:0, rh:0};	// image, text width/height, real width/height
	}
	
	TextFormat.prototype.clone = function()
	{
		return (new TextFormat(this.font, this.size, this.color, this.bold, this.italic, this.align, this.leading));
	}
	
	TextFormat.prototype.set = function(tf)
	{
		this.font = tf.font;
		this.size = tf.size;
		this.color = tf.color;
		this.bold = tf.bold;
		this.italic = tf.italic;
		this.align = tf.align;
		this.leading = tf.leading;
	}
	
	TextFormat.prototype.getImageData = function(s, tf)	// string, TextField - read only
	{
		var canv = TextFormat._canvas;
		var cont = TextFormat._context;
		var data = this.data;
		
		canv.width	= data.rw = this._nhpt(tf._areaW); //console.log(tf._areaW, canv.width);
		canv.height	= data.rh = this._nhpt(tf._areaH); //console.log(tf._areaH, canv.height);
	
		var c = this.color;
		var r = (c>>16 & 0x0000ff);
		var g = (c>>8 & 0x0000ff);
		var b = (c & 0x0000ff);
		
		cont.textBaseline = "top";
		cont.fillStyle = "rgb("+r+","+g+","+b+")";
		cont.font = (this.italic?"italic ":"")+(this.bold?"bold ":"")+this.size+"px "+this.font;
		
		this.maxW = 0;
		var pars = s.split("\n");
		var line = 0;
		var posY = 0;
		var lineH = this.size * 1.25;
		for(var i=0; i<pars.length; i++)
		{
			var lc = this.renderPar(pars[i], posY, lineH, cont, tf);
			line += lc;
			posY += lc *(lineH +this.leading);
		}
		if(this.align == TextFormatAlign.JUSTIFY) this.maxW = Math.max(this.maxW, tf._areaW);
		
		data.image = canv;
		data.tw = this.maxW;
		data.th = (lineH+this.leading)*line - this.leading;
		return data;
	}
	
	TextFormat.prototype.renderPar = function(s, posY, lineH, cont, tf)	// returns number of lines
	{
		var words;
		if(tf._wordWrap) words = s.split(" ");
		else words = [s];
		
		var spacew = cont.measureText(" ").width;
		var curlw = 0;			// current line width
		var maxlw = tf._areaW;	// maximum line width
		var cl = 0;				// current line
		
		var lines = [[]];		// array of lines , line = (arrays of words)
		var lspace = [];		// free line space
		
		for(var i=0; i<words.length; i++)
		{
			var word = words[i];
			var ww = cont.measureText(word).width;
			if(curlw + ww <= maxlw || curlw == 0)
			{
				lines[cl].push(word);
				curlw += ww + spacew;
			}
			else
			{
				lspace.push(maxlw - curlw + spacew);
				lines.push([]);
				cl++;
				curlw = 0;
				i--;
			}
		}
		lspace.push(maxlw - curlw + spacew);
		
		for(var i=0; i<lines.length; i++)
		{
			var line = lines[i];
			while(line[line.length-1] == "") {line.pop(); lspace[i] += spacew; }
			this.maxW = Math.max(this.maxW, maxlw-lspace[i]);
			
			var gap, lineY = posY + (lineH+this.leading)*i;
			curlw = 0, gap = spacew;
			if(this.align == TextFormatAlign.CENTER ) curlw = lspace[i]*0.5;
			if(this.align == TextFormatAlign.RIGHT  ) curlw = lspace[i];
			if(this.align == TextFormatAlign.JUSTIFY) gap = spacew+lspace[i]/(line.length-1);
			
			for(var j=0; j<line.length; j++)
			{
				var word = line[j];
				cont.fillText(word, curlw, lineY);
				var ww = cont.measureText(word).width;
				if(i < lines.length-1) curlw += ww + gap;	// not last line
				else {curlw += ww + spacew;}				// last line
			}
		}
		return cl+1;
	}
	
	TextFormat.prototype._nhpt = function(x) 
	{
		--x;
		for (var i = 1; i < 32; i <<= 1) x = x | x >> i;
		return x + 1;
	}
	
	TextFormat._canvas = document.createElement("canvas");
	TextFormat._context = TextFormat._canvas.getContext("2d");
	
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
	

