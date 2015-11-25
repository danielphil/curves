module Curves
{
	export abstract class View
	{
		protected container: HTMLElement;
		
		constructor(container: HTMLElement) {
			this.container = container;
			$(window).resize(() => this.resize());
		}
		
		protected abstract resize() : void;
		abstract render() : void;
	}
}