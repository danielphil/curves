/// <reference path="Hermite.ts" />
/// <reference path="ThreeView.ts" />

module Curves {
    export class CurveRenderView extends ThreeView
    {
        private curve = new Curves.Hermite();
        
        constructor(container: HTMLElement) {
            super(container);
            
            var leftX = -1.0;
            var rightX = 1.0;
            
            var geometry = new THREE.BufferGeometry();
			// create a simple square shape. We duplicate the top left and bottom right
			// vertices because each vertex needs to appear once per triangle.
			// three components per vertex
			// components of the position vector for each vertex are stored
			// contiguously in the buffer.
			var vertices = new Float32Array([
				leftX, -1.0, 0,
                leftX, 1.0, 0,
				rightX, -1.0, 0,
                rightX, -1.0, 0,
                leftX, 1.0, 0,
				rightX, 1.0, 0
			]);
			var uv = new Float32Array([
				0, 1,
				1, 1,
				1, 0,
				1, 0,
				0, 0,
				0, 1
			]);
            var color = new Float32Array([
                1, 0, 0,
                0, 0, 1,
                0, 1, 0,
                0, 1, 0,
                0, 0, 1,
                1, 1, 1
            ]);
			// itemSize = 3 because there are 3 values (components) per vertex
			geometry.addAttribute('position', new THREE.BufferAttribute( vertices, 3 ) );
			geometry.addAttribute('uv', new THREE.BufferAttribute(uv, 2));
            geometry.addAttribute('color', new THREE.BufferAttribute(color, 3));
			
			var material = new THREE.MeshBasicMaterial( {
                vertexColors: THREE.VertexColors,
                wireframe: true,
                depthTest: false,
                depthWrite: false
            });
            
			var cube = new THREE.Mesh( geometry, material );
			this.scene.add(cube);
            
            this.camera.position.z = 1.5;
			this.camera.updateProjectionMatrix();
            
            this.renderer.sortObjects = false;
            this.render();
        }

        setCurve(curve: Curves.Hermite) {
			this.curve = curve;
		}
    }
}