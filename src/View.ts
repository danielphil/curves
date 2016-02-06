module Curves
{
	export abstract class View
	{
		protected container: HTMLElement;
        protected activeTool: Tool;
        private onToolChangeCallback: (toolName: string) => void;
        
		constructor(container: HTMLElement, onToolChangeCallback: (toolName: string) => void) {
			this.container = container;
            this.onToolChangeCallback = onToolChangeCallback;
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
            this.onToolChangeCallback(newTool.name());
        }
	}
}