
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
		// Listen on canvas so we don't interfere with external elements.
		c.addEventListener("contextmenu",		Stage._ctxt, false);
		c.addEventListener("dragstart",			Stage._blck, false);

		if(Stage._isTD())
		{
			c.addEventListener("touchstart",	Stage._onTD, false);
			c.addEventListener("touchmove",		Stage._onTM, false);
			c.addEventListener("touchend",		Stage._onTU, false);
			c.addEventListener("touchstart",	Stage._blck, false);
			c.addEventListener("touchmove",		Stage._blck, false);
			c.addEventListener("touchend",		Stage._blck, false);
		}
		else
		{
			c.addEventListener("mousedown",		Stage._onMD, false);
			c.addEventListener("mousemove",		Stage._onMM, false);
			c.addEventListener("mouseup",		Stage._onMU, false);
			//c.addEventListener("mousedown",		Stage._blck, false);
			//c.addEventListener("mousemove",		Stage._blck, false);
			//c.addEventListener("mouseup",		Stage._blck, false);
		}
		c.addEventListener("keydown",	Stage._onKD, false);
		c.addEventListener("keyup",		Stage._onKU, false);
		c.addEventListener("keydown",	Stage._blck, false);
		c.addEventListener("keyup",		Stage._blck, false);

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
		// Set this based on canvas, instead of window.
		var w = this._canvas.width;
		var h = this._canvas.height;

		this.stageWidth = w;
		this.stageHeight = h;

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




