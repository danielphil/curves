var Curves;
(function (Curves) {
    var View = (function () {
        function View(container, onToolChangeCallback) {
            var _this = this;
            this.container = container;
            this.onToolChangeCallback = onToolChangeCallback;
            $(window).resize(function () { return _this.resize(false); });
        }
        View.prototype.changeActiveTool = function (newTool) {
            if (this.activeTool) {
                this.activeTool.detach();
                this.activeTool = null;
            }
            this.activeTool = newTool;
            newTool.attach(this.container);
            this.onToolChangeCallback(newTool.name());
        };
        return View;
    })();
    Curves.View = View;
})(Curves || (Curves = {}));
/// <reference path="View.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Curves;
(function (Curves) {
    var CanvasView = (function (_super) {
        __extends(CanvasView, _super);
        function CanvasView(container, onToolChangeCallback) {
            _super.call(this, container, onToolChangeCallback);
            var width = $(container).width();
            var height = $(container).height();
            this.canvas = document.createElement("canvas");
            this.canvas.width = width;
            this.canvas.height = height;
            container.appendChild(this.canvas);
        }
        CanvasView.prototype.resize = function () {
            this.canvas.width = $(this.container).width();
            this.canvas.height = $(this.container).height();
            this.render();
        };
        return CanvasView;
    })(Curves.View);
    Curves.CanvasView = CanvasView;
})(Curves || (Curves = {}));
/// <reference path="../typings/threejs/three.d.ts" />
var Curves;
(function (Curves) {
    var Hermite = (function () {
        function Hermite() {
            this.points = [];
            this.curvePoints = [];
            this.curveTangents = [];
        }
        Hermite.prototype.addPoint = function (x, y, x_t, y_t) {
            this.points.push({
                position: new THREE.Vector2(x, y),
                tangent: new THREE.Vector2(x_t, y_t)
            });
            if (this.onChangeCallback) {
                this.onChangeCallback();
            }
        };
        Hermite.prototype.clearPoints = function () {
            this.points = [];
            this.curvePoints = [];
            this.curveTangents = [];
            if (this.onChangeCallback) {
                this.onChangeCallback();
            }
        };
        Hermite.clamp = function (val) {
            if (val < 0) {
                return 0;
            }
            else if (val > 1) {
                return 1;
            }
            else {
                return val;
            }
        };
        Hermite.interp = function (u, P0, P1, PT0, PT1) {
            var u3 = Math.pow(u, 3);
            var u2 = Math.pow(u, 2);
            return (2 * u3 - 3 * u2 + 1) * P0 + (-2 * u3 + 3 * u2) * P1 + (u3 - 2 * u2 + u) * PT0 + (u3 - u2) * PT1;
        };
        Hermite.gradient = function (u, P0, P1, PT0, PT1) {
            var u2 = Math.pow(u, 2);
            return 3 * u2 * (2 * P0 - 2 * P1 + PT0 + PT1) - 2 * u * (3 * P0 - 3 * P1 + 2 * PT0 + PT1) + PT0;
        };
        Hermite.interpolateSegment = function (cp0, cp1, t) {
            var p0 = cp0.position;
            var pT0 = cp0.tangent;
            var p1 = cp1.position;
            var pT1 = cp1.tangent;
            t = Hermite.clamp(t);
            return new THREE.Vector2(Hermite.interp(t, p0.x, p1.x, pT0.x, pT1.x), Hermite.interp(t, p0.y, p1.y, pT0.y, pT1.y));
        };
        Hermite.interpolateTangent = function (cp0, cp1, t) {
            var p0 = cp0.position;
            var pT0 = cp0.tangent;
            var p1 = cp1.position;
            var pT1 = cp1.tangent;
            t = Hermite.clamp(t);
            var gradient = new THREE.Vector2(Hermite.gradient(t, p0.x, p1.x, pT0.x, pT1.x), Hermite.gradient(t, p0.y, p1.y, pT0.y, pT1.y));
            var tangent = new THREE.Vector2(gradient.y, gradient.x * -1);
            return tangent.normalize();
        };
        Hermite.approxSegmentLength = function (cp0, cp1) {
            var points = [];
            for (var u = 0; u <= 1; u += 0.1) {
                points.push(Curves.Hermite.interpolateSegment(cp0, cp1, u));
            }
            var length = 0;
            for (var i = 0; i < points.length - 1; i++) {
                length += new THREE.Vector2().copy(points[i + 1]).sub(points[i]).length();
            }
            return length;
        };
        Hermite.solveTridiagonalMatrix = function (a, b, c, d) {
            if (a.length != b.length || a.length != c.length || a.length != d.length) {
                console.error("a, b, c and d must all be equal length");
            }
            var n = a.length;
            var aDash = 0;
            var bDash = 1;
            var cDash = new Float32Array(n);
            cDash[0] = c[0] / b[0];
            for (var i = 1; i < n; i++) {
                cDash[i] = c[i] / (b[i] - cDash[i - 1] * a[i]);
            }
            var dDash = new Float32Array(n);
            dDash[0] = d[0] / b[0];
            for (var i = 1; i < n; i++) {
                dDash[i] = (d[i] - dDash[i - 1] * a[i]) / (b[i] - cDash[i - 1] * a[i]);
            }
            var x = new Float32Array(n);
            x[n - 1] = dDash[n - 1];
            for (var i = n - 2; i >= 0; i--) {
                x[i] = dDash[i] - cDash[i] * x[i + 1];
            }
            return x;
        };
        Hermite.generateTangentsClampedEnd1d = function (points, v0Tangent, v1Tangent) {
            // TODO: tidy up the unnecessary calculations in here
            var n = points.length;
            if (n < 3) {
                return;
            }
            var a = new Float32Array(n);
            a[0] = 0;
            for (var i = 1; i < n - 1; i++) {
                a[i] = 1;
            }
            a[n - 1] = 0;
            var b = new Float32Array(n);
            b[0] = 1;
            for (var i = 1; i < n - 1; i++) {
                b[i] = 4;
            }
            b[n - 1] = 1;
            var c = new Float32Array(a);
            var d = new Float32Array(n);
            d[0] = v0Tangent;
            for (var i = 1; i < n - 1; i++) {
                d[i] = 3 * (points[i + 1] - points[i - 1]);
            }
            d[n - 1] = v1Tangent;
            return Hermite.solveTridiagonalMatrix(a, b, c, d);
        };
        Hermite.generateTangentsNaturalSpline1d = function (points) {
            // TODO: tidy up the unnecessary calculations in here
            var n = points.length;
            if (n < 3) {
                return new Float32Array(0);
            }
            var a = new Float32Array(n);
            a[0] = 0;
            for (var i = 1; i < n; i++) {
                a[i] = 1;
            }
            var b = new Float32Array(n);
            b[0] = 2;
            for (var i = 1; i < n - 1; i++) {
                b[i] = 4;
            }
            b[n - 1] = 2;
            var c = new Float32Array(a);
            c[0] = 1;
            c[n - 1] = 0;
            var d = new Float32Array(n);
            d[0] = 3 * (points[1] - points[0]);
            for (var i = 1; i < n - 1; i++) {
                d[i] = 3 * (points[i + 1] - points[i - 1]);
            }
            d[n - 1] = 3 * (points[n - 1] - points[n - 2]);
            return Hermite.solveTridiagonalMatrix(a, b, c, d);
        };
        Hermite.prototype.generateTangentsClampedEnd = function () {
            // Algorithm from Essential Games and Interactive Applications 2nd Ed. p 446
            var x_positions = this.points.map(function (controlPoint) { return controlPoint.position.x; });
            var y_positions = this.points.map(function (controlPoint) { return controlPoint.position.y; });
            var xTangents = Hermite.generateTangentsClampedEnd1d(new Float32Array(x_positions), this.points[0].tangent.x, this.points[this.points.length - 1].tangent.x);
            var yTangents = Hermite.generateTangentsClampedEnd1d(new Float32Array(y_positions), this.points[0].tangent.y, this.points[this.points.length - 1].tangent.y);
            for (var i = 0; i < xTangents.length; i++) {
                this.points[i].tangent.set(xTangents[i], yTangents[i]);
            }
        };
        Hermite.prototype.generateTangentsNaturalSpline = function () {
            // Algorithm from Essential Games and Interactive Applications 2nd Ed. p 448
            var x_positions = this.points.map(function (controlPoint) { return controlPoint.position.x; });
            var y_positions = this.points.map(function (controlPoint) { return controlPoint.position.y; });
            var xTangents = Hermite.generateTangentsNaturalSpline1d(new Float32Array(x_positions));
            var yTangents = Hermite.generateTangentsNaturalSpline1d(new Float32Array(y_positions));
            for (var i = 0; i < xTangents.length; i++) {
                this.points[i].tangent.set(xTangents[i], yTangents[i]);
            }
        };
        Hermite.prototype.generateCurve = function () {
            this.curvePoints = [];
            this.curveTangents = [];
            var noOfPoints = this.points.length;
            if (noOfPoints < 2) {
                return;
            }
            for (var i = 0; i < noOfPoints - 1; i++) {
                var p0 = this.points[i];
                var p1 = this.points[i + 1];
                for (var u = 0; u <= 1; u += 0.1) {
                    this.curvePoints.push(Hermite.interpolateSegment(p0, p1, u));
                    this.curveTangents.push(Hermite.interpolateTangent(p0, p1, u));
                }
            }
        };
        Hermite.prototype.onChangeHandler = function (callback) {
            this.onChangeCallback = callback;
        };
        return Hermite;
    })();
    Curves.Hermite = Hermite;
})(Curves || (Curves = {}));
/// <reference path="CanvasView.ts" />
/// <reference path="Hermite.ts" />
var Curves;
(function (Curves) {
    var CanvasCurveRenderView = (function (_super) {
        __extends(CanvasCurveRenderView, _super);
        function CanvasCurveRenderView() {
            _super.apply(this, arguments);
            this.image = new Image();
            this.curve = new Curves.Hermite();
        }
        CanvasCurveRenderView.prototype.setImage = function (image) {
            this.image = image;
            this.render();
        };
        CanvasCurveRenderView.prototype.setCurve = function (curve) {
            this.curve = curve;
        };
        CanvasCurveRenderView.prototype.render = function () {
            if (this.image.width === 0 || this.image.height === 0) {
                return;
            }
            var noOfPoints = this.curve.points.length;
            if (noOfPoints < 2) {
                return;
            }
            var context = this.canvas.getContext("2d");
            var srcData = this.getSourceImageData(this.image);
            var dstData = context.createImageData(this.canvas.width, this.canvas.height);
            var centerY = (this.canvas.height / 2) | 0;
            var rgb = [0, 0, 255];
            var x = 0;
            for (var i = 0; i < noOfPoints - 1; i++) {
                var p0 = this.curve.points[i];
                var p1 = this.curve.points[i + 1];
                var length = Curves.Hermite.approxSegmentLength(p0, p1);
                for (var pos = 0; pos <= length; pos++) {
                    var u = pos / length;
                    var pointOnCurve = Curves.Hermite.interpolateSegment(p0, p1, u);
                    var tangentForPoint = Curves.Hermite.interpolateTangent(p0, p1, u);
                    for (var y = 0; y < dstData.height; y++) {
                        var distanceAlongTangent = centerY - y;
                        var scaledTangent = new THREE.Vector2().copy(tangentForPoint).multiplyScalar(distanceAlongTangent);
                        var samplePoint = new THREE.Vector2().copy(pointOnCurve).add(scaledTangent);
                        this.getPixel(srcData, samplePoint.x, samplePoint.y, rgb);
                        this.setPixel(dstData, x, y, rgb);
                    }
                    x++;
                }
            }
            context.putImageData(dstData, 0, 0);
        };
        CanvasCurveRenderView.prototype.getPixel = function (srcData, x, y, rgb) {
            var xInt = x | 0;
            var yInt = y | 0;
            if (xInt < 0 || xInt >= srcData.width || yInt < 0 || yInt >= srcData.height) {
                rgb[0] = 0;
                rgb[1] = 0;
                rgb[2] = 0;
            }
            else {
                var index = 4 * (xInt + yInt * srcData.width);
                rgb[0] = srcData.data[index];
                rgb[1] = srcData.data[index + 1];
                rgb[2] = srcData.data[index + 2];
            }
        };
        CanvasCurveRenderView.prototype.setPixel = function (dstData, x, y, rgb) {
            var index = 4 * (x + y * dstData.width);
            dstData.data[index] = rgb[0];
            dstData.data[index + 1] = rgb[1];
            dstData.data[index + 2] = rgb[2];
            dstData.data[index + 3] = 255;
        };
        CanvasCurveRenderView.prototype.getSourceImageData = function (image) {
            var tmpCanvas = document.createElement("canvas");
            tmpCanvas.width = image.width;
            tmpCanvas.height = image.height;
            var context = tmpCanvas.getContext("2d");
            context.drawImage(image, 0, 0);
            return context.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height);
        };
        return CanvasCurveRenderView;
    })(Curves.CanvasView);
    Curves.CanvasCurveRenderView = CanvasCurveRenderView;
})(Curves || (Curves = {}));
/// <reference path="../typings/threejs/three.d.ts" />
/// <reference path="../typings/jquery.d.ts" />
/// <reference path="View.ts" />
var Curves;
(function (Curves) {
    var ThreeView = (function (_super) {
        __extends(ThreeView, _super);
        function ThreeView(container, onToolChangeCallback) {
            _super.call(this, container, onToolChangeCallback);
            this.scene = new THREE.Scene();
            this.renderer = new THREE.WebGLRenderer();
            var width = $(container).width();
            var height = $(container).height();
            this.renderer.setSize(width, height);
            this.container.appendChild(this.renderer.domElement);
            this.resize(true);
            this.render();
        }
        ThreeView.prototype.resize = function (initialResize) {
            var width = $(this.container).width();
            var height = $(this.container).height();
            this.camera = new THREE.OrthographicCamera(width / -500, width / 500, height / -500, height / 500, 1, 1000);
            this.renderer.setSize(width, height);
            this.render();
        };
        ThreeView.prototype.render = function () {
            this.renderer.render(this.scene, this.camera);
        };
        return ThreeView;
    })(Curves.View);
    Curves.ThreeView = ThreeView;
})(Curves || (Curves = {}));
/// <reference path="../typings/threejs/three.d.ts" />
/// <reference path="../typings/jquery.d.ts" />
/// <reference path="Tool.ts" />
var Curves;
(function (Curves) {
    var ZoomTool = (function () {
        function ZoomTool(adjustZoomCallback) {
            var _this = this;
            this.mouseDown = false;
            this.lastMouse = new THREE.Vector2();
            this.mouseDownHandler = function (e) { return _this.handleMouseDown(e); };
            this.mouseMoveHandler = function (e) { return _this.handleMouseMove(e); };
            this.mouseUpHandler = function (e) { return _this.handleMouseUp(e); };
            this.mouseLeaveHandler = function (e) { return _this.handleMouseLeave(e); };
            this.adjustZoomCallback = adjustZoomCallback;
        }
        ZoomTool.prototype.attach = function (container) {
            this.container = container;
            $(this.container).on("mousedown", this.mouseDownHandler);
            $(this.container).on("mousemove", this.mouseMoveHandler);
            $(this.container).on("mouseup", this.mouseUpHandler);
            $(this.container).on("mouseleave", this.mouseLeaveHandler);
        };
        ZoomTool.prototype.detach = function () {
            $(this.container).off("mousedown", this.mouseDownHandler);
            $(this.container).off("mousemove", this.mouseMoveHandler);
            $(this.container).off("mouseup", this.mouseUpHandler);
            $(this.container).off("mouseleave", this.mouseLeaveHandler);
            this.mouseDown = false;
        };
        ZoomTool.prototype.name = function () {
            return "zoom";
        };
        ZoomTool.prototype.handleMouseDown = function (e) {
            if (e.which == 1) {
                this.mouseDown = true;
                this.lastMouse = new THREE.Vector2(e.offsetX, e.offsetY);
            }
        };
        ZoomTool.prototype.handleMouseMove = function (e) {
            if (this.mouseDown) {
                var newMouse = new THREE.Vector2(e.offsetX, e.offsetY);
                var delta = new THREE.Vector2().copy(newMouse).sub(this.lastMouse);
                this.adjustZoomCallback(delta.y);
                this.lastMouse = newMouse;
            }
        };
        ZoomTool.prototype.handleMouseUp = function (e) {
            if (e.which == 1) {
                this.mouseDown = false;
            }
        };
        ZoomTool.prototype.handleMouseLeave = function (e) {
            this.mouseDown = false;
        };
        return ZoomTool;
    })();
    Curves.ZoomTool = ZoomTool;
})(Curves || (Curves = {}));
/// <reference path="Hermite.ts" />
/// <reference path="ThreeView.ts" />
/// <reference path="ZoomTool.ts" />
var Curves;
(function (Curves) {
    var CurveRenderView = (function (_super) {
        __extends(CurveRenderView, _super);
        function CurveRenderView(container, onToolChangeCallback) {
            var _this = this;
            _super.call(this, container, onToolChangeCallback);
            this.curve = new Curves.Hermite();
            this.pan = new THREE.Vector3(0, 0, 1.5);
            this.zoom = 1.0;
            this.useLinearCurveInterpolation = false;
            this.panTool = new Curves.PanTool(function (pan) {
                var scaling = 0.01 / _this.zoom;
                _this.pan.add(new THREE.Vector3(-pan.x * scaling, -pan.y * scaling, 0));
                _this.updateCamera(_this.camera);
                _this.render();
            });
            this.zoomTool = new Curves.ZoomTool(function (zoom) {
                var zoomStep = Math.pow(2, 1 / 100);
                var currentStep = Math.log(_this.zoom) / Math.log(zoomStep);
                currentStep += zoom;
                _this.zoom = Math.pow(zoomStep, currentStep);
                _this.zoom = Math.max(_this.zoom, 0.01);
                _this.updateCamera(_this.camera);
                _this.render();
            });
            this.updateCamera(this.camera);
            var geometry = this.buildGeometry([], [], [], []);
            var material = this.createDummyMaterial();
            this.mesh = new THREE.Mesh(geometry, material);
            this.scene.add(this.mesh);
            this.renderer.sortObjects = false;
            this.render();
        }
        CurveRenderView.prototype.setTextureData = function (data) {
            var _this = this;
            if (this.texture) {
                this.texture.dispose();
            }
            var loader = new THREE.TextureLoader();
            loader.load(data, function (texture) {
                texture.minFilter = THREE.LinearFilter;
                texture.flipY = false;
                _this.texture = texture;
                _this.updateScene();
            });
        };
        CurveRenderView.prototype.setCurve = function (curve) {
            this.curve = curve;
            this.pan.set(0, 0, 1.5);
            this.zoom = 1;
            this.updateCamera(this.camera);
            this.updateScene();
        };
        CurveRenderView.prototype.activatePan = function () {
            this.changeActiveTool(this.panTool);
        };
        CurveRenderView.prototype.activateZoom = function () {
            this.changeActiveTool(this.zoomTool);
        };
        CurveRenderView.prototype.toggleLinearCurveInterpolation = function (useLinear) {
            this.useLinearCurveInterpolation = useLinear;
            this.updateScene();
        };
        CurveRenderView.prototype.resize = function (initialResize) {
            _super.prototype.resize.call(this, initialResize);
            if (!initialResize) {
                this.updateCamera(this.camera);
                this.render();
            }
        };
        CurveRenderView.prototype.updateCamera = function (camera) {
            camera.position.copy(this.pan);
            camera.zoom = this.zoom;
            camera.updateProjectionMatrix();
        };
        CurveRenderView.prototype.updateScene = function () {
            var curve = this.curve;
            var texture = this.texture;
            var imageHeightPixels = 0;
            var imageWidthPixels = 0;
            var geometry;
            var material;
            if (curve && curve.points.length > 3 && texture) {
                imageHeightPixels = texture.image.height;
                imageWidthPixels = texture.image.width;
                geometry = this.generateGeometryFromCurve(curve, imageHeightPixels);
                material = this.createCurveRenderMaterial(curve, texture, this.useLinearCurveInterpolation);
            }
            else {
                geometry = this.buildGeometry([], [], [], []);
                material = this.createDummyMaterial();
            }
            this.mesh.geometry.dispose();
            this.mesh.geometry = geometry;
            this.mesh.material.dispose();
            this.mesh.material = material;
            this.render();
        };
        CurveRenderView.prototype.generateGeometryFromCurve = function (curve, imageHeightPixels) {
            var lengths = [];
            for (var i = 0; i < curve.points.length - 1; i++) {
                lengths.push(Curves.Hermite.approxSegmentLength(curve.points[i], curve.points[i + 1]));
            }
            var totalLengthPixels = lengths.reduce(function (a, b) { return a + b; });
            var widthScale = 480;
            var totalWidth = totalLengthPixels / widthScale;
            var top = -2;
            var bottom = 2;
            var x = -totalWidth / 2;
            var vertices = new Array();
            var color = new Array();
            var uv = new Array();
            var segmentIndex = new Array();
            var scaledLengths = lengths.map(function (length) { return length / widthScale; });
            scaledLengths.forEach(function (length, index) {
                var right = x + length;
                vertices.push(x, top, 0, x, bottom, 0, right, top, 0, right, top, 0, x, bottom, 0, right, bottom, 0);
                var extent = imageHeightPixels * 2;
                uv.push(0, extent, 0, -extent, 1, extent, 1, extent, 0, -extent, 1, -extent);
                segmentIndex.push(index, index, index, index, index, index);
                color.push(1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1);
                x += length;
            });
            return this.buildGeometry(vertices, uv, color, segmentIndex);
        };
        CurveRenderView.prototype.buildGeometry = function (vertices, uv, color, segmentIndex) {
            var geometry = new THREE.BufferGeometry();
            geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
            geometry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array(uv), 2));
            geometry.addAttribute('color', new THREE.BufferAttribute(new Float32Array(color), 3));
            geometry.addAttribute('segmentIndex', new THREE.BufferAttribute(new Float32Array(segmentIndex), 1));
            return geometry;
        };
        CurveRenderView.prototype.createDummyMaterial = function () {
            return new THREE.MeshBasicMaterial({
                vertexColors: THREE.VertexColors,
                wireframe: true,
                depthTest: false,
                depthWrite: false
            });
        };
        CurveRenderView.prototype.createCurveRenderMaterial = function (curve, texture, useLinearCurveInterpolation) {
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
        };
        return CurveRenderView;
    })(Curves.ThreeView);
    Curves.CurveRenderView = CurveRenderView;
})(Curves || (Curves = {}));
/// <reference path="../typings/jquery.d.ts" />
/// <reference path="Tool.ts" />
var Curves;
(function (Curves) {
    var AddPointTool = (function () {
        function AddPointTool(curve, coordConversionCallback) {
            var _this = this;
            this.mouseHandler = function (e) { return _this.handleClick(e); };
            this.curve = curve;
            this.coordConversionCallback = coordConversionCallback;
        }
        AddPointTool.prototype.attach = function (container) {
            this.container = container;
            $(this.container).on("click", this.mouseHandler);
        };
        AddPointTool.prototype.detach = function () {
            $(this.container).off("click", this.mouseHandler);
        };
        AddPointTool.prototype.name = function () {
            return "addPoint";
        };
        AddPointTool.prototype.handleClick = function (e) {
            var coords = this.coordConversionCallback(e.offsetX, e.offsetY);
            this.curve.addPoint(coords.x, coords.y, 1, 0);
        };
        return AddPointTool;
    })();
    Curves.AddPointTool = AddPointTool;
})(Curves || (Curves = {}));
/// <reference path="../typings/threejs/three.d.ts" />
/// <reference path="../typings/jquery.d.ts" />
/// <reference path="Tool.ts" />
var Curves;
(function (Curves) {
    var PanTool = (function () {
        function PanTool(adjustPanCallback) {
            var _this = this;
            this.mouseDown = false;
            this.lastMouse = new THREE.Vector2();
            this.mouseDownHandler = function (e) { return _this.handleMouseDown(e); };
            this.mouseMoveHandler = function (e) { return _this.handleMouseMove(e); };
            this.mouseUpHandler = function (e) { return _this.handleMouseUp(e); };
            this.mouseLeaveHandler = function (e) { return _this.handleMouseLeave(e); };
            this.adjustPanCallback = adjustPanCallback;
        }
        PanTool.prototype.attach = function (container) {
            this.container = container;
            $(this.container).on("mousedown", this.mouseDownHandler);
            $(this.container).on("mousemove", this.mouseMoveHandler);
            $(this.container).on("mouseup", this.mouseUpHandler);
            $(this.container).on("mouseleave", this.mouseLeaveHandler);
        };
        PanTool.prototype.detach = function () {
            $(this.container).off("mousedown", this.mouseDownHandler);
            $(this.container).off("mousemove", this.mouseMoveHandler);
            $(this.container).off("mouseup", this.mouseUpHandler);
            $(this.container).off("mouseleave", this.mouseLeaveHandler);
            this.mouseDown = false;
        };
        PanTool.prototype.name = function () {
            return "pan";
        };
        PanTool.prototype.handleMouseDown = function (e) {
            if (e.which == 1) {
                this.mouseDown = true;
                this.lastMouse = new THREE.Vector2(e.offsetX, e.offsetY);
            }
        };
        PanTool.prototype.handleMouseMove = function (e) {
            if (this.mouseDown) {
                var newMouse = new THREE.Vector2(e.offsetX, e.offsetY);
                var delta = new THREE.Vector2().copy(newMouse).sub(this.lastMouse);
                this.adjustPanCallback(delta);
                this.lastMouse = newMouse;
            }
        };
        PanTool.prototype.handleMouseUp = function (e) {
            if (e.which == 1) {
                this.mouseDown = false;
            }
        };
        PanTool.prototype.handleMouseLeave = function (e) {
            this.mouseDown = false;
        };
        return PanTool;
    })();
    Curves.PanTool = PanTool;
})(Curves || (Curves = {}));
/// <reference path="../typings/jquery.d.ts" />
/// <reference path="../typings/threejs/three.d.ts" />
/// <reference path="AddPointTool.ts" />
/// <reference path="CanvasView.ts" />
/// <reference path="Hermite.ts" />
/// <reference path="PanTool.ts" />
var Curves;
(function (Curves) {
    var CurveEditView = (function (_super) {
        __extends(CurveEditView, _super);
        function CurveEditView(container, curve, onToolChangeCallback) {
            var _this = this;
            _super.call(this, container, onToolChangeCallback);
            this.image = new Image();
            this.curve = new Curves.Hermite();
            this.pan = new THREE.Vector2();
            this.useLinearCurveInterpolation = false;
            this.showTangentsAndControlPoints = false;
            this.curve = curve;
            this.addPointTool = new Curves.AddPointTool(curve, function (x, y) { return new THREE.Vector2(x, y).sub(_this.imageOffset()); });
            this.panTool = new Curves.PanTool(function (pan) {
                _this.pan.add(pan);
                _this.render();
            });
        }
        CurveEditView.prototype.setImage = function (image) {
            this.image = image;
            this.pan = new THREE.Vector2();
            this.render();
        };
        CurveEditView.prototype.render = function () {
            var _this = this;
            var context = this.canvas.getContext("2d");
            context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            if (!this.image.src) {
                context.font = "18px sans-serif";
                context.fillText("No image loaded", 10, 30);
                return;
            }
            var translation = this.imageOffset();
            context.save();
            context.translate(translation.x, translation.y);
            if (this.image.src) {
                context.drawImage(this.image, 0, 0);
            }
            this.curve.points.forEach(function (point) {
                context.fillStyle = "black";
                var rectSize = 5;
                context.fillRect(point.position.x - rectSize / 2, point.position.y - rectSize / 2, rectSize, rectSize);
                if (!_this.useLinearCurveInterpolation && _this.showTangentsAndControlPoints) {
                    context.strokeStyle = "black";
                    context.beginPath();
                    context.moveTo(point.position.x, point.position.y);
                    context.lineTo(point.position.x + point.tangent.x, point.position.y + point.tangent.y);
                    context.stroke();
                }
            });
            if (this.useLinearCurveInterpolation) {
                this.drawLinearCurve(context);
            }
            else {
                this.drawHermiteCurve(context);
            }
            context.restore();
        };
        CurveEditView.prototype.toggleLinearCurveInterpolation = function (useLinear) {
            this.useLinearCurveInterpolation = useLinear;
            this.render();
        };
        CurveEditView.prototype.toggleShowTangentsAndControlPoints = function () {
            this.showTangentsAndControlPoints = !this.showTangentsAndControlPoints;
            this.render();
            return this.showTangentsAndControlPoints;
        };
        CurveEditView.prototype.drawLinearCurve = function (context) {
            if (this.curve.points.length < 2) {
                return;
            }
            context.strokeStyle = "red";
            context.beginPath();
            var p0 = this.curve.points[0].position;
            context.moveTo(p0.x, p0.y);
            for (var i = 1; i < this.curve.points.length; i++) {
                context.lineTo(this.curve.points[i].position.x, this.curve.points[i].position.y);
            }
            context.stroke();
        };
        CurveEditView.prototype.drawHermiteCurve = function (context) {
            if (this.curve.curvePoints.length < 2) {
                return;
            }
            context.strokeStyle = "red";
            context.beginPath();
            var p0 = this.curve.curvePoints[0];
            context.moveTo(p0.x, p0.y);
            for (var i = 1; i < this.curve.curvePoints.length; i++) {
                context.lineTo(this.curve.curvePoints[i].x, this.curve.curvePoints[i].y);
            }
            context.stroke();
            if (this.showTangentsAndControlPoints) {
                context.strokeStyle = "blue";
                for (var i = 0; i < this.curve.curveTangents.length; i++) {
                    context.beginPath();
                    var t0 = this.curve.curvePoints[i];
                    var scaledTangent = new THREE.Vector2().copy(this.curve.curveTangents[i]).multiplyScalar(10);
                    var t1 = new THREE.Vector2().copy(t0).add(scaledTangent);
                    context.moveTo(t0.x, t0.y);
                    context.lineTo(t1.x, t1.y);
                    context.stroke();
                }
            }
        };
        CurveEditView.prototype.imageOffset = function () {
            var originToCanvasCentre = new THREE.Vector2(this.canvas.width / 2, this.canvas.height / 2);
            var imageCentreToOrigin = new THREE.Vector2(-this.image.width / 2, -this.image.height / 2);
            return new THREE.Vector2().copy(this.pan).add(originToCanvasCentre).add(imageCentreToOrigin);
        };
        CurveEditView.prototype.activateAddPoint = function () {
            if (!this.image.src) {
                return;
            }
            this.changeActiveTool(this.addPointTool);
        };
        CurveEditView.prototype.activatePan = function () {
            if (!this.image.src) {
                return;
            }
            this.changeActiveTool(this.panTool);
        };
        return CurveEditView;
    })(Curves.CanvasView);
    Curves.CurveEditView = CurveEditView;
})(Curves || (Curves = {}));
/// <reference path="../typings/threejs/three.d.ts" />
/// <reference path="../typings/jquery.d.ts" />
/// <reference path="CanvasCurveRenderView.ts" />
/// <reference path="CurveRenderView.ts" />
/// <reference path="CurveEditView.ts" />
/// <reference path="Hermite.ts" />
var curveImage = new Image();
var curveEditView;
var canvasCurveRenderView;
var curveRenderView;
function loadImage(e) {
    var filelist = e.target.files;
    if (filelist.length == 0) {
        return;
    }
    var file = filelist[0];
    var reader = new FileReader();
    reader.onload = function (e) {
        if (curveRenderView) {
            curveRenderView.setTextureData(e.target.result);
        }
        curveImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
}
$(function () {
    var useLinearCurveInterpolation = false;
    curveImage.onload = function () {
        curve.clearPoints();
        curveEditView.setImage(curveImage);
        if (canvasCurveRenderView) {
            canvasCurveRenderView.setImage(curveImage);
        }
        curveEditView.activateAddPoint();
        curveRenderView.activateZoom();
    };
    var curve = new Curves.Hermite();
    curve.addPoint(100, 100, 0, 10);
    curve.addPoint(150, 150, -10, -10);
    curve.addPoint(170, 90, 20, 10);
    curve.addPoint(200, 90, 15, 25);
    curve.addPoint(270, 200, 40, 0);
    curve.addPoint(130, 300, 0, -40);
    curve.generateTangentsNaturalSpline();
    curve.generateCurve();
    curveEditView = new Curves.CurveEditView($('#content').get(0), curve, onCurveEditToolChange);
    if (false) {
        canvasCurveRenderView = new Curves.CanvasCurveRenderView($("#render").get(0), onCurveRenderToolChange);
    }
    else {
        curveRenderView = new Curves.CurveRenderView($("#render").get(0), onCurveRenderToolChange);
    }
    curveEditView.render();
    if (canvasCurveRenderView) {
        canvasCurveRenderView.setCurve(curve);
        canvasCurveRenderView.render();
    }
    else {
        curveRenderView.setCurve(curve);
        curveRenderView.render();
    }
    $("#loadSourceImage").on("change", loadImage);
    curve.onChangeHandler(function () {
        curve.generateTangentsNaturalSpline();
        curve.generateCurve();
        curveEditView.render();
        curveRenderView.setCurve(curve);
    });
    $("#panButton").click(function () {
        curveEditView.activatePan();
    });
    $("#renderPanButton").click(function () {
        curveRenderView.activatePan();
    });
    $("#renderZoomButton").click(function () {
        curveRenderView.activateZoom();
    });
    $("#addPointsButton").click(function () {
        curveEditView.activateAddPoint();
    });
    $("#clearCurveButton").click(function () {
        curve.clearPoints();
    });
    $("#linearCurveInterpButton").click(function () {
        useLinearCurveInterpolation = !useLinearCurveInterpolation;
        curveEditView.toggleLinearCurveInterpolation(useLinearCurveInterpolation);
        curveRenderView.toggleLinearCurveInterpolation(useLinearCurveInterpolation);
        if (useLinearCurveInterpolation) {
            $("#linearCurveInterpButton").addClass("btn-success");
            $("#showEditTangentsButton").attr("disabled", "disabled");
        }
        else {
            $("#linearCurveInterpButton").removeClass("btn-success");
            $("#showEditTangentsButton").removeAttr("disabled");
        }
    });
    $("#showEditTangentsButton").click(function () {
        var enabled = curveEditView.toggleShowTangentsAndControlPoints();
        if (enabled) {
            $("#showEditTangentsButton").addClass("btn-success");
        }
        else {
            $("#showEditTangentsButton").removeClass("btn-success");
        }
    });
    function onCurveEditToolChange(toolname) {
        if (toolname == "pan") {
            $("#panButton").addClass("btn-primary");
            $("#addPointsButton").removeClass("btn-primary");
        }
        else if (toolname == "addPoint") {
            $("#panButton").removeClass("btn-primary");
            $("#addPointsButton").addClass("btn-primary");
        }
    }
    function onCurveRenderToolChange(toolname) {
        if (toolname == "pan") {
            $("#renderPanButton").addClass("btn-primary");
            $("#renderZoomButton").removeClass("btn-primary");
        }
        else if (toolname == "zoom") {
            $("#renderPanButton").removeClass("btn-primary");
            $("#renderZoomButton").addClass("btn-primary");
        }
    }
});
//# sourceMappingURL=curves.js.map