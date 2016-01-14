/// <reference path="../typings/threejs/three.d.ts" />
/// <reference path="../typings/jquery.d.ts" />
/// <reference path="Tool.ts" />

module Curves
{
    export class PanTool implements Tool
    {
        private container: HTMLElement;
        private adjustPanCallback: (pan: THREE.Vector2) => void;
        private mouseDown = false;
        private lastMouse = new THREE.Vector2();
        
        private mouseDownHandler = (e: JQueryEventObject) => this.handleMouseDown(e);
        private mouseMoveHandler = (e: JQueryEventObject) => this.handleMouseMove(e);
        private mouseUpHandler = (e: JQueryEventObject) => this.handleMouseUp(e);
        private mouseLeaveHandler = (e: JQueryEventObject) => this.handleMouseLeave(e);
        
        constructor(adjustPanCallback: (pan: THREE.Vector2) => void) {
            this.adjustPanCallback = adjustPanCallback;
        }
        
        attach(container: HTMLElement) {
            this.container = container;
            $(this.container).on("mousedown", this.mouseDownHandler);
            $(this.container).on("mousemove", this.mouseMoveHandler);
            $(this.container).on("mouseup", this.mouseUpHandler);
            $(this.container).on("mouseleave", this.mouseLeaveHandler);
        }
        
        detach() {
            $(this.container).off("mousedown", this.mouseDownHandler);
            $(this.container).off("mousemove", this.mouseMoveHandler);
            $(this.container).off("mouseup", this.mouseUpHandler);
            $(this.container).off("mouseleave", this.mouseLeaveHandler);
            this.mouseDown = false;
        }
        
        private handleMouseDown(e: JQueryEventObject) {
            // left button only for now
            if (e.which == 1) {
                this.mouseDown = true;
                this.lastMouse = new THREE.Vector2(e.offsetX, e.offsetY);
            }            
        }
        
        private handleMouseMove(e: JQueryEventObject) {
            if (this.mouseDown) {
                var newMouse = new THREE.Vector2(e.offsetX, e.offsetY);
                var delta = new THREE.Vector2().copy(newMouse).sub(this.lastMouse);
                
                this.adjustPanCallback(delta);
                
                this.lastMouse = newMouse;
            }
        }
        
        private handleMouseUp(e: JQueryEventObject) {
            if (e.which == 1) {
                this.mouseDown = false;
            }
        }
        
        private handleMouseLeave(e: JQueryEventObject) {
            this.mouseDown = false;
        }
    }
}