module Curves
{
	export abstract class View
	{
		protected container: HTMLElement;
        protected activeTool: Tool;
        
		constructor(container: HTMLElement) {
			this.container = container;
			$(window).resize(() => this.resize(false));
		}
		
		protected abstract resize(initialResize: boolean) : void;
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