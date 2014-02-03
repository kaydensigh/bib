

	/*
		There are 3 states in the game
		
		
		1. MainMenu		2. LevelSelect		3.GameControl
													|
													Game
	*/
	function Main(wi, hi)
	{
		Resizable.call(this, wi, hi);
		this.mm;
		this.ls;
		this.gc;
		
		this.addEventListener("GoPlay",			Main.GoPlay			);		// 1 -> 2
		this.addEventListener("GoBack",			Main.GoBack			);		// 2 -> 1		
		this.addEventListener("LevelChosen", 	Main.LevelChosen	);		// 2 -> 3
		this.addEventListener("GameDone", 		Main.GameDone		);		// 3 -> 2 when finished
		this.addEventListener("ExitGame",		Main.ExitGame		);		// 3 -> 2 when exiting a game
		
		this.addEventListener2(Event.ADDED_TO_STAGE, this.onATS, this);
	}	
	Main.prototype = new Resizable();
	
	Main.prototype.onATS = function(e)
	{
		this.stage.addEventListener2(Event.RESIZE, this.resize, this);
		this.resize(null);
	}

	Main.prototype.resize = function(e)
	{
		var wi = this.stage.stageWidth;
		var hi = this.stage.stageHeight;
		this.w = wi;  this.h = hi;
		if(this.mm) this.mm.resize(wi, hi);
		if(this.ls) this.ls.resize(wi, hi);
		if(this.gc) this.gc.resize(wi, hi);
	}
	
	Main.GoPlay = function(e)
	{
		var th = e.target;
		th.removeChild(th.mm);
		th.addChild(th.ls);
	}
	
	Main.GoBack = function(e)
	{
		var th = e.target;
		th.removeChild(th.ls);
		th.addChild(th.mm);
	}
	
	Main.LevelChosen = function(e)
	{
		var th = e.target;
		th.removeChild(th.ls);
		th.addChild(th.gc);
		th.gc.StartLevel(th.ls.levelData);
	}
	
	Main.GameDone = function(e)
	{
		var th = e.target;
		th.removeChild(th.gc);
		th.addChild(th.ls);
		th.ls.LevelDone(th.gc.result);
	}
	
	Main.ExitGame = function(e)
	{
		var th = e.target;
		th.removeChild(th.gc);
		th.addChild(th.ls);
	}
	