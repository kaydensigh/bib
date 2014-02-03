
	function GameControl(wi, hi)
	{
		Resizable.call(this, wi, hi);
		
		this.result = {}; 		// result of the last gameplay
	}
	GameControl.prototype = new Resizable();
		
	GameControl.prototype.GameDone = function(o)
	{
		this.dispatchEvent(new Event("GameDone", true));
	}
	
	GameControl.prototype.Restart = function(o)
	{
		this.dispatchEvent(new Event("Restart", true));
	}
	
	GameControl.prototype.ExitGame = function(o)
	{
		this.dispatchEvent(new Event("ExitGame", true));
	}