/// <reference path="Hermite.ts" />
/// <reference path="ThreeView.ts" />

module Curves {
    export class CurveRenderView extends ThreeView
    {
        private curve = new Curves.Hermite();
        private mesh: THREE.Mesh;
        private texture: THREE.Texture;

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

        setTextureData(data: string) {
            if (this.texture) {
                this.texture.dispose();
            }
            var loader = new THREE.TextureLoader();
            loader.load(data, (texture) => {
                texture.minFilter = THREE.LinearFilter; // Need to do this or the texture is flipped in Y by default?
                texture.flipY = true; 
                this.texture = texture;
                this.updateScene();
            });
        }
        
        setCurve(curve: Curves.Hermite) {
			this.curve = curve;
            this.updateScene();
		}
        
        private updateScene() {
            var curve = this.curve;
            if (!curve || curve.points.length < 2) {
                // TODO: Should set up a default scene here instead
                return;
            }
            
            var texture = this.texture;
            if (!texture) {
                // TODO: Again, should set up a default scene here if there's no texture available
                return;
            }
            
            var texWidth = texture.image.width;
			
            
            // Get the approximate length of each segment of the curve
            var lengths: number[] = [];
            for (var i = 0; i < curve.points.length - 1; i++) {
                lengths.push(Curves.Hermite.approxSegmentLength(curve.points[i], curve.points[i + 1]));
            }
            
            // Hardcoding for now- need to read this from the image
            var imageHeightPixels = texture.image.height;
            var imageWidthPixels = texture.image.width;

            var totalLengthPixels = lengths.reduce(function (a, b) { return a + b; });
            
            // The height of the texture is scaled to 1.0 so we need to perform a similar scaling to normalise the length
            var totalWidth = totalLengthPixels / imageHeightPixels;        
            
            // Build up the geometry
            var top = -0.5;
            var bottom = 0.5;
            var x = -totalWidth / 2;
            var vertices = new Array<number>();
            var color = new Array<number>();
            var uv = new Array<number>();
            var segmentIndex = new Array<number>();
            var segmentDelta = new Array<number>();
            
            var scaledLengths = lengths.map(function (length) { return length / imageHeightPixels; });
            scaledLengths.forEach(function (length, index) {
                var right = x + length;
                vertices.push(
                    x, top, 0,
                    x, bottom, 0,
                    right, top, 0,
                    right, top, 0,
                    x, bottom, 0,
                    right, bottom, 0
                );
                
                var halfImageHeight = imageHeightPixels / 2;
                uv.push(
                    0, -halfImageHeight,
                    0, halfImageHeight,
                    1, -halfImageHeight,
                    1, -halfImageHeight,
                    0, halfImageHeight,
                    1, halfImageHeight
                );
                
                // Yuck. Must tidy up.
                // This is used to get the index of the current segment. Needs to be the same over the entire
                // triangle to avoid interpolation in the shader.
                segmentIndex.push(index, index, index, index, index, index);
                
                // Runs from 0 to 1, where 0 is the left side of the segment, and 1 is the right. We do want
                // interpolation here, as this is used to calculate how far along the curve segment we are.
                segmentDelta.push(0, 0, 1, 1, 0, 1);
                
                color.push(
                    1, 0, 0,
                    0, 0, 1,
                    0, 1, 0,
                    0, 1, 0,
                    0, 0, 1,
                    1, 1, 1
                );
                
                x += length;
            });
            
            var geometry = new THREE.BufferGeometry();
			geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));           
			geometry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array(uv), 2));           
            geometry.addAttribute('color', new THREE.BufferAttribute(new Float32Array(color), 3));
            geometry.addAttribute('segmentIndex', new THREE.BufferAttribute(new Float32Array(segmentIndex), 1));
            geometry.addAttribute('segmentDelta', new THREE.BufferAttribute(new Float32Array(segmentDelta), 1));
            
            this.mesh.geometry.dispose();
            // BufferGeometry not convertable to Geometry? Hence cast below.
            this.mesh.geometry = <any>geometry;
            
            this.mesh.material.dispose();
            this.mesh.material = new THREE.ShaderMaterial({
                uniforms: {
                    uPoints: { type: "v2v", value: curve.points.map(function (cp) { return cp.position; }) },
                    uTangents: { type: "v2v", value: curve.points.map(function (cp) { return cp.tangent; }) },
                    uTexture: { type: "t", value: texture },
                    uTextureDimensions: { type: "v2", value: new THREE.Vector2(imageWidthPixels, imageHeightPixels) }
                },
                defines: {
                    NO_OF_CONTROL_POINTS: curve.points.length
                },
                vertexShader: document.getElementById('curve-render-vertex-shader').textContent,
                fragmentShader: document.getElementById('curve-render-fragment-shader').textContent,
                wireframe: false,
                vertexColors: THREE.VertexColors
            });
            
            this.render();
        }
    }
}