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
	
