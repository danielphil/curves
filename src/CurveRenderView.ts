/// <reference path="Hermite.ts" />
/// <reference path="ThreeView.ts" />
/// <reference path="ZoomTool.ts" />

module Curves {
    export class CurveRenderView extends ThreeView
    {
        private curve = new Curves.Hermite();
        private mesh: THREE.Mesh;
        private texture: THREE.Texture;

        private panTool: PanTool;
        private zoomTool: ZoomTool;
        
        private pan = new THREE.Vector3(0, 0, 1.5);
        private zoom = 1.0;
        
        private useLinearCurveInterpolation = false;
        
        constructor(container: HTMLElement) {
            super(container);
            
            this.panTool = new Curves.PanTool((pan) => {
               var scaling = 0.01 / this.zoom;
               this.pan.add(new THREE.Vector3(-pan.x * scaling, -pan.y * scaling, 0));
               this.updateCamera(this.camera);
               this.render(); 
            });
            
            this.zoomTool = new Curves.ZoomTool((zoom) => {
                // Double zoom for every 100 pixels of movement
                var zoomStep = Math.pow(2, 1 / 100);
                var currentStep = Math.log(this.zoom) / Math.log(zoomStep);
                currentStep += zoom;
                this.zoom = Math.pow(zoomStep, currentStep);
                this.zoom = Math.max(this.zoom, 0.01);
                this.updateCamera(this.camera);
                this.render();
            })
            
            this.updateCamera(this.camera);
            
            // Create dummy geometry for now
            var geometry = this.buildGeometry([], [], [], []);
			var material = this.createDummyMaterial();
            
			this.mesh = new THREE.Mesh(geometry, material);
			this.scene.add(this.mesh);
            
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
                texture.flipY = false; 
                this.texture = texture;
                this.updateScene();
            });
        }
        
        setCurve(curve: Curves.Hermite) {
			this.curve = curve;
            
            this.pan.set(0, 0, 1.5);
            this.zoom = 1;
            this.updateCamera(this.camera);
            
            this.updateScene();
		}
        
        activatePan() {
            this.changeActiveTool(this.panTool);
        }
        
        activateZoom() {
            this.changeActiveTool(this.zoomTool);
        }
        
        toggleLinearCurveInterpolation(useLinear: boolean) : void {
            this.useLinearCurveInterpolation = useLinear;
            this.updateScene();
        }
        
        protected resize(initialResize: boolean) {
            super.resize(initialResize);
            
            // The view has not been completely initialised on initial resize, so
            // don't try to update the camera here
            if (!initialResize) {
                this.updateCamera(this.camera);
                this.render();
            }
        }
        
        protected updateCamera(camera: THREE.OrthographicCamera) {
            camera.position.copy(this.pan);
            camera.zoom = this.zoom;
            camera.updateProjectionMatrix();
        }
        
        private updateScene() {
            var curve = this.curve;
            var texture = this.texture;
            
            var imageHeightPixels = 0;
            var imageWidthPixels = 0;
            var geometry: THREE.BufferGeometry;
            var material: THREE.Material;
            if (curve && curve.points.length > 3 && texture) {
                // We have a valid curve and image, so we can render something
                imageHeightPixels = texture.image.height;
                imageWidthPixels = texture.image.width;
                geometry = this.generateGeometryFromCurve(curve, imageHeightPixels);
                material = this.createCurveRenderMaterial(curve, texture, this.useLinearCurveInterpolation);
            } else {
                // We don't have a curve and a texture so we can't render anything
                geometry = this.buildGeometry([], [], [], []);
                material = this.createDummyMaterial();
            }
            
            this.mesh.geometry.dispose();
            // BufferGeometry not convertable to Geometry? Hence cast below.
            this.mesh.geometry = <any>geometry;
            
            this.mesh.material.dispose();
            this.mesh.material = material;
            
            this.render();
        }
        
        private generateGeometryFromCurve(curve: Hermite, imageHeightPixels: number) : THREE.BufferGeometry {
            // Get the approximate length of each segment of the curve
            var lengths: number[] = [];
            for (var i = 0; i < curve.points.length - 1; i++) {
                lengths.push(Curves.Hermite.approxSegmentLength(curve.points[i], curve.points[i + 1]));
            }
            
            var totalLengthPixels = lengths.reduce(function (a, b) { return a + b; });
            
            // Hardcoded scaling factor here to determine the width of the curve geometry
            var widthScale = 480;
            var totalWidth = totalLengthPixels / widthScale;        
            
            // Build up the geometry
            var top = -2;
            var bottom = 2;
            var x = -totalWidth / 2;
            var vertices = new Array<number>();
            var color = new Array<number>();
            var uv = new Array<number>();
            var segmentIndex = new Array<number>();
            
            var scaledLengths = lengths.map(function (length) { return length / widthScale; });
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
                
                var extent = imageHeightPixels * 2;
                uv.push(
                    0, extent,
                    0, -extent,
                    1, extent,
                    1, extent,
                    0, -extent,
                    1, -extent
                );
                
                // Yuck. Must tidy up.
                // This is used to get the index of the current segment. Needs to be the same over the entire
                // triangle to avoid interpolation in the shader.
                segmentIndex.push(index, index, index, index, index, index);
                
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
            
            return this.buildGeometry(vertices, uv, color, segmentIndex);
        }
        
        private buildGeometry(vertices: number[], uv: number[], color: number[], segmentIndex: number[]) : THREE.BufferGeometry
        {
            var geometry = new THREE.BufferGeometry();
            geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));           
			geometry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array(uv), 2));           
            geometry.addAttribute('color', new THREE.BufferAttribute(new Float32Array(color), 3));
            geometry.addAttribute('segmentIndex', new THREE.BufferAttribute(new Float32Array(segmentIndex), 1));
            
            return geometry;
        }
        
        private createDummyMaterial() : THREE.Material {
            return new THREE.MeshBasicMaterial({
                vertexColors: THREE.VertexColors,
                wireframe: true,
                depthTest: false,
                depthWrite: false
            });
        }
        
        private createCurveRenderMaterial(curve: Hermite, texture: THREE.Texture, useLinearCurveInterpolation: boolean) : THREE.Material {
            var imageHeightPixels = texture.image.height;
            var imageWidthPixels = texture.image.width;
            
            return new THREE.ShaderMaterial({
                uniforms: {
                    uPoints: { type: "v2v", value: curve.points.map(function (cp) { return cp.position; }) },
                    uTangents: { type: "v2v", value: curve.points.map(function (cp) { return cp.tangent; }) },
                    uTexture: { type: "t", value: texture },
                    uTextureDimensions: { type: "v2", value: new THREE.Vector2(imageWidthPixels, imageHeightPixels) }
                },
                defines: {
                    NO_OF_CONTROL_POINTS: curve.points.length,
                    LINEAR_CURVE_INTERPOLATION: useLinearCurveInterpolation
                },
                vertexShader: document.getElementById('curve-render-vertex-shader').textContent,
                fragmentShader: document.getElementById('curve-render-fragment-shader').textContent,
                vertexColors: THREE.VertexColors
            });
        }
    }
}