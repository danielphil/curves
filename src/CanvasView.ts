/// <reference path="View.ts" />

module Curves
{
	export abstract class CanvasView extends View
	{
		protected canvas : HTMLCanvasElement;
		
		constructor(container: HTMLElement) {
			super(container);
			
			var width = $(container).width();
			var height = $(container).height();
			
			this.canvas = document.createElement("canvas");
			this.canvas.width = width;
			this.canvas.height = height;
			container.appendChild(this.canvas);
		}
		
		protected resize() {
			this.canvas.width = $(this.container).width();
			this.canvas.height = $(this.container).height();
			
			this.render();
		}
	}
}