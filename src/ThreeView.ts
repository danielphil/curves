/// <reference path="../typings/threejs/three.d.ts" />
/// <reference path="../typings/jquery.d.ts" />
/// <reference path="View.ts" />

module Curves {
	export abstract class ThreeView extends View
	{
		protected scene = new THREE.Scene();
		protected camera : THREE.OrthographicCamera;		
		protected renderer = new THREE.WebGLRenderer();
		
		constructor(container: HTMLElement, onToolChangeCallback: (toolName: string) => void) {
			super(container, onToolChangeCallback);
			
			var width = $(container).width();
			var height = $(container).height();
			
			this.renderer.setSize(width, height);
			this.container.appendChild(this.renderer.domElement);
			
			this.resize(true);
			this.render();
		}
		
		protected resize(initialResize: boolean) {
			var width = $(this.container).width();
			var height = $(this.container).height();
			
			this.camera = new THREE.OrthographicCamera(
				width / -500,
				width / 500,
				height / -500,
				height / 500,
				1,
				1000
			);
            
			this.renderer.setSize(width, height);
			this.render();
		}
		
		render() {
			this.renderer.render(this.scene, this.camera);
		}
	}
}