/// <reference path="../typings/threejs/three.d.ts" />
/// <reference path="../typings/jquery.d.ts" />

module Curves {
	export class CurveView
	{
		private scene = new THREE.Scene();
		
		private camera = new THREE.OrthographicCamera(
			window.innerWidth / -500,
			window.innerWidth / 500,
			window.innerHeight / 500,
			window.innerHeight / -500,
			1,
			1000
		);
		
		private renderer = new THREE.WebGLRenderer();
		
		private container: HTMLElement;
		
		constructor(container: HTMLElement) {
			this.container = container;
			
			this.renderer.setSize($(container).width(), $(container).height());
			container.appendChild(this.renderer.domElement);
			
			$(window).resize(this.resize);
			this.render();
		}
		
		loadTexture(data: string) {
			var loader = new THREE.TextureLoader();
			loader.load(data, this.createScene);
		}
		
		private createScene(texture: THREE.Texture) {
			this.scene = new THREE.Scene();
			
			texture.minFilter = THREE.LinearFilter;
			texture.flipY = false; // Need to do this or the texture is flipped in Y by default?
			
			var texWidth = texture.image.width;
			var texHeight = texture.image.height;
			
			var aspect = texWidth / texHeight;
			var leftX = -aspect;
			var rightX = aspect;
			var geometry = new THREE.BufferGeometry();
			// create a simple square shape. We duplicate the top left and bottom right
			// vertices because each vertex needs to appear once per triangle.
			// three components per vertex
			// components of the position vector for each vertex are stored
			// contiguously in the buffer.
			var vertices = new Float32Array([
				leftX, -1.0, 0,
				rightX, -1.0, 0,
				rightX, 1.0, 0,
				rightX, 1.0, 0,
				leftX, 1.0, 0,
				leftX, -1.0, 0
			]);
			var uv = new Float32Array([
				0, 1,
				1, 1,
				1, 0,
				1, 0,
				0, 0,
				0, 1
			]);
			// itemSize = 3 because there are 3 values (components) per vertex
			geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
			geometry.addAttribute('uv', new THREE.BufferAttribute(uv, 2));
			
			var material = new THREE.MeshBasicMaterial( { map: texture } );
			var cube = new THREE.Mesh( geometry, material );
			this.scene.add(cube);
			this.camera.position.z = 1.5;
			this.camera.zoom = 1.5;
			this.camera.updateProjectionMatrix();
			
			//registerDragHandler(renderer.domElement, cube);
			
			this.render();
		}
		
		private resize() {
			this.renderer.setSize($(this.container).width(), $(this.container).height());
		}
		
		private render() {
			this.renderer.render(this.scene, this.camera);
		}
	}
}