
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
	
	