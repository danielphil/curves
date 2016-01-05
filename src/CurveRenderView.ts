/// <reference path="Hermite.ts" />
/// <reference path="ThreeView.ts" />

module Curves {
    export class CurveRenderView extends ThreeView
    {
        private curve = new Curves.Hermite();
        private mesh: THREE.Mesh;
        
        constructor(container: HTMLElement) {
            super(container);
            
            // Create a dummy geometry for now
            var geometry = new THREE.BufferGeometry();
			geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array([]), 3));           
			geometry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array([]), 2));           
            geometry.addAttribute('color', new THREE.BufferAttribute(new Float32Array([]), 3));

			var material = new THREE.MeshBasicMaterial( {
                vertexColors: THREE.VertexColors,
                wireframe: true,
                depthTest: false,
                depthWrite: false
            });
            
			this.mesh = new THREE.Mesh(geometry, material );
			this.scene.add(this.mesh);
            
            this.camera.position.z = 1.5;
			this.camera.updateProjectionMatrix();
            
            this.renderer.sortObjects = false;
            this.render();
        }

        setCurve(curve: Curves.Hermite) {
			this.curve = curve;
            
            if (curve.points.length < 2) {
                return;
            }
                        
            var leftX = -1.0;
            var rightX = 1.0;
        
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
            
            var geometry = new THREE.BufferGeometry();
			geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));           
			geometry.addAttribute('uv', new THREE.BufferAttribute(uv, 2));           
            geometry.addAttribute('color', new THREE.BufferAttribute(color, 3));
            
            this.mesh.geometry.dispose();
            // BufferGeometry not convertable to Geometry? Hence cast below.
            this.mesh.geometry = <any>geometry;
		}
    }
}