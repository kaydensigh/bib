
function MainMenu(wi, hi)
{
	Resizable.call(this, wi, hi);
}
MainMenu.prototype = new Resizable();

MainMenu.prototype.GoPlay = function()
{
	this.dispatchEvent(new Event("GoPlay", true));
}
