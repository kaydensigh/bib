	//package net.ivank.geom;

	/**
	 * A basic class for representing an axis-aligned rectangle
	 * @author Ivan Kuckir
	 *
	 */
	 
	/**
	 * @constructor
	 */	
	function Rectangle(x, y, w, h)
	{	
		this.x = x;
		this.y = y;
		this.width = w;
		this.height = h;		
	}
		
	Rectangle.prototype.clone = function()
	{
		return new Rectangle(this.x, this.y, this.width, this.height);
	}
		
	Rectangle.prototype.contains = function(x, y)
	{
		return (x >= this.x && x <= this.x+this.width) && (y >= this.y && y <= this.y+this.height);
	}
	
	Rectangle.prototype.containsPoint = function(p)
	{
		return this.contains(p.x, p.y);
	}
	
	Rectangle.prototype.containsRect = function(r)
	{
		return (this.x<=r.x && this.y<=r.y && r.x+r.width<=this.x+this.width && r.y+r.height<=this.y+this.height);
	}
	
	Rectangle.prototype.copyFrom = function(r)
	{
		this.x = r.x; this.y = r.y; this.width = r.width; this.height = r.height;
	}
	
	Rectangle.prototype.equals = function(r)
	{
		return(this.x==r.x && this.y==r.y && this.width==r.width && this.height == r.height);
	}
	
	Rectangle.prototype.inflate = function(dx, dy)
	{
		this.x -= dx;
		this.y -= dy;
		this.width  += 2*dx;
		this.height += 2*dy;
	}
	
	Rectangle.prototype.inflatePoint = function(p)
	{
		this.inflate(p.x, p.y);
	}
	
	Rectangle.prototype.intersection = function(rec)	// : Boolean
	{
		var l = Math.max(this.x, rec.x);
		var u = Math.max(this.y, rec.y);
		var r = Math.min(this.x+this.width , rec.x+rec.width );
		var d = Math.min(this.y+this.height, rec.y+rec.height);
		return new Rectangle(l, u, r-l, d-u);
	}
	
	Rectangle.prototype.intersects = function(r)	// : Boolean
	{
		if(r.y+r.height<this.y || r.x>this.x+this.width || r.y>this.y+this.height || r.x+r.width<this.x) return false;
		return true;
	}
	
	Rectangle.prototype.isEmpty = function()	// : Boolean
	{
		return (this.width<=0 || this.height <= 0);
	}
	
	Rectangle.prototype.offset = function(dx, dy)	// : Boolean
	{
		this.x += dx; this.y += dy;
	}
	
	Rectangle.prototype.offsetPoint = function(p)	// : Boolean
	{
		this.offset(p.x, p.y)
	}
	
	Rectangle.prototype.setEmpty = function()	// : Boolean
	{
		this.x = this.y = this.width = this.height = 0;
	}
	
	Rectangle.prototype.setTo = function(r)	// : Boolean
	{
		this.x = r.x; this.y = r.y; this.width = r.width; this.height = r.height;
	}
		
	Rectangle.prototype.union = function(r)	// : Rectangle
	{
		var nr = this.clone();
		nr._unionWith(r);
		return nr;
	}

	
	Rectangle._temp = new Float32Array(2);
	
	Rectangle.prototype._unionWith = function(r) // : void
	{
		this._unionWP(r.x, r.y);
		this._unionWP(r.x+r.width, r.y+r.height);
	}
	
	Rectangle.prototype._unionWP = function(x, y)	// union with point
	{
		var minx = Math.min(this.x, x);
		var miny = Math.min(this.y, y);
		this.width  = Math.max(this.x + this.width , x) - minx;
		this.height = Math.max(this.y + this.height, y) - miny;
		this.x = minx; this.y = miny;
	}
	
	Rectangle.prototype._setP = function(x, y)
	{
		this.x = x; this.y = y;
		this.width = this.height = 0;
	}
	
	Rectangle.prototype._setAndTransform = function(r, m)
	{
		var t = Rectangle._temp;
		var mv2 = Point._m4.multiplyVec2;
		t[0] = r.x; t[1] = r.y;
		mv2(m, t, t);
		this._setP(t[0], t[1]);
		
		t[0] = r.x+r.width; t[1] = r.y;
		mv2(m, t, t);
		this._unionWP(t[0], t[1]);
		
		t[0] = r.x; t[1] = r.y+r.height;
		mv2(m, t, t);
		this._unionWP(t[0], t[1]);
		
		t[0] = r.x+r.width; t[1] = r.y+r.height;
		mv2(m, t, t);
		this._unionWP(t[0], t[1]);
	}
