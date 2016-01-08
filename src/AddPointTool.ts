/// <reference path="../typings/jquery.d.ts" />
/// <reference path="Tool.ts" />

module Curves
{
    export class AddPointTool implements Tool
    {
        private container: HTMLElement;
        
        attach(container: HTMLElement) {
            this.container = container;
            $(this.container).on("click", this.handleClick);
        }
        
        detach() {
            $(this.container).off("click", this.handleClick);
        }
        
        private handleClick(e: JQueryEventObject) {
            console.log("got click: " + e.offsetX + ", " + e.offsetY);
        }
    }
}