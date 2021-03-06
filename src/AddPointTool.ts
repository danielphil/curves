/// <reference path="../typings/jquery.d.ts" />
/// <reference path="Tool.ts" />

module Curves
{
    export class AddPointTool implements Tool
    {
        private container: HTMLElement;
        private curve: Hermite;
        private coordConversionCallback: (x: number, y: number) => THREE.Vector2;
        
        private mouseHandler = (e: JQueryEventObject) => this.handleClick(e);
        
        constructor(curve: Hermite, coordConversionCallback: (x: number, y: number) => THREE.Vector2) {
            this.curve = curve;
            this.coordConversionCallback = coordConversionCallback;
        }
        
        attach(container: HTMLElement) {
            this.container = container;
            $(this.container).on("click", this.mouseHandler);
        }
        
        detach() {
            $(this.container).off("click", this.mouseHandler);
        }
        
        name() {
            return "addPoint";
        }
        
        private handleClick(e: JQueryEventObject) {
            // Dummy tangent values of 1 and 0 for now as these will be autogenerated later
            var coords = this.coordConversionCallback(e.offsetX, e.offsetY);
            this.curve.addPoint(coords.x, coords.y, 1, 0);
        }
    }
}