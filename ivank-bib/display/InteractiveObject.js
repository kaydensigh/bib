
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
		