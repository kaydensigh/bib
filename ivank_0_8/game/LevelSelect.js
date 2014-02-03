
	function LevelSelect(wi, hi)
	{
		Resizable.call(this, wi, hi);
		
		this.levelData = new Object();	// info about selected level
	}
	LevelSelect.prototype = new Resizable();
	
	LevelSelect.prototype.LevelDone = function(o){}
		
	LevelSelect.prototype.GoBack = function(o)
	{
		this.dispatchEvent(new Event("GoBack", true));
	}
		
	LevelSelect.prototype.LevelChosen = function(o)
	{
		this.dispatchEvent(new Event("LevelChosen", true));
	}