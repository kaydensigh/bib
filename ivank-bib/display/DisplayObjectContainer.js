
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

	DisplayObjectContainer.prototype.removeChildren = function(beginIndex, endIndex)
	{
		if (typeof beginIndex != 'number')  beginIndex = 0;
		if (typeof endIndex != 'number')  endIndex = this.numChildren;
		var count = endIndex - beginIndex;
		if (count <= 0)  return;
		for (var i = beginIndex; i < endIndex; i++)
		{
			var c = this._children[i];
			c.parent = null;
			c._setStage(null);
		}
		this._children.splice(beginIndex, count);
		this.numChildren -= count;
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


