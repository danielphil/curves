module Curves
{
	export abstract class View
	{
		protected container: HTMLElement;
        protected activeTool: Tool;
        
		constructor(container: HTMLElement) {
			this.container = container;
			$(window).resize(() => this.resize());
		}
		
		protected abstract resize() : void;
		abstract render() : void;
        
        protected changeActiveTool(newTool : Tool) {
            if (this.activeTool) {
                this.activeTool.detach();
                this.activeTool = null;
            }
            this.activeTool = newTool;
            newTool.attach(this.container);
        }
	}
}