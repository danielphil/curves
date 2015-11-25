/// <reference path="../typings/threejs/three.d.ts" />
/// <reference path="../typings/jquery.d.ts" />
/// <reference path="ThreeView.ts" />

module Curves {
	export class CurveView extends ThreeView
	{
		private curve = new Curves.Hermite();
		private curvePointGeometry = new THREE.PlaneGeometry(0.03, 0.03);
		private curvePointMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, depthTest: false, depthWrite: false });
		
		setCurve(curve: Curves.Hermite) {
			this.curve = curve;
		}
		
		setTextureData(data: string) {
			var loader = new THREE.TextureLoader();
			loader.load(data, (texture) => this.createScene(texture));
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
			
			var material = new THREE.MeshBasicMaterial( { map: texture, depthTest: false, depthWrite: false } );
			var cube = new THREE.Mesh( geometry, material );
			this.scene.add(cube);
			
			this.camera.position.z = 1.5;
			this.camera.zoom = 0.5;
			this.camera.updateProjectionMatrix();
			
			
			this.curve.points.forEach((controlPoint) => {
				var point = controlPoint.position;
				var pointMesh = new THREE.Mesh(this.curvePointGeometry, this.curvePointMaterial);
				pointMesh.position.x = point.x / 100 - 1;
				pointMesh.position.y = point.y / 100 - 1;
				this.scene.add(pointMesh);
			});
			
			this.renderer.sortObjects = false;
			//registerDragHandler(renderer.domElement, cube);
			
			this.render();
		}
	}
}