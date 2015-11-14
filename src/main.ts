/// <reference path="../typings/threejs/three.d.ts" />
/// <reference path="../typings/jquery.d.ts" />
/// <reference path="Hermite.ts" />

var canvas : HTMLCanvasElement;
var renderCanvas : HTMLCanvasElement;
var curve : Curves.Hermite;
var curveImage = new Image();

function paintCurveCanvas() {
	var context = canvas.getContext("2d");
	context.drawImage(curveImage, 0, 0);
	
	curve.points.forEach(function (point) {
		context.fillStyle = "black";
		var rectSize = 5;
		context.fillRect(point.position.x - rectSize / 2, point.position.y - rectSize / 2, rectSize, rectSize);
		
		context.strokeStyle = "black";
		context.beginPath();
		context.moveTo(point.position.x, point.position.y);
		context.lineTo(point.position.x + point.tangent.x, point.position.y + point.tangent.y);
		context.stroke();
	})
	
	if (curve.curvePoints.length >= 2) {
		context.strokeStyle = "red";
		context.beginPath();
		var p0: THREE.Vector2 = curve.curvePoints[0];
		context.moveTo(p0.x, p0.y);
		
		for (var i = 1; i < curve.curvePoints.length; i++) {
			context.lineTo(curve.curvePoints[i].x, curve.curvePoints[i].y);
		}

		context.stroke();
		
		context.strokeStyle = "blue";
		for (var i = 0; i < curve.curveTangents.length; i++) {
			context.beginPath();
			var t0 = curve.curvePoints[i];
			var scaledTangent = new THREE.Vector2().copy(curve.curveTangents[i]).multiplyScalar(10);
			var t1 = new THREE.Vector2().copy(t0).add(scaledTangent);
			context.moveTo(t0.x, t0.y);
			context.lineTo(t1.x, t1.y);
			context.stroke();
		}
	}
}

function getSourceImageData(image: HTMLImageElement) {
	var tmpCanvas = document.createElement("canvas");
	tmpCanvas.width = image.width;
	tmpCanvas.height = image.height;
	var context = tmpCanvas.getContext("2d");
	context.drawImage(image, 0, 0);
	return context.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height);
}

function getPixel(srcData: ImageData, x: number, y: number, rgb: number[]) {
	var xInt = x | 0;
	var yInt = y | 0;
	if (xInt < 0 || xInt >= srcData.width || yInt < 0 || yInt >= srcData.height) {
		rgb[0] = 0;
		rgb[1] = 0;
		rgb[2] = 0;
	}
	var index = 4 * (xInt + yInt * srcData.width);
	rgb[0] = srcData.data[index]; // R
	rgb[1] = srcData.data[index + 1]; // G
	rgb[2] = srcData.data[index + 2]; // B
}

function setPixel(dstData: ImageData, x: number, y: number, rgb: number[]) {
	var index = 4 * (x + y * dstData.width);
	dstData.data[index] = rgb[0]; // R
	dstData.data[index + 1] = rgb[1]; // G
	dstData.data[index + 2] = rgb[2]; // B
	dstData.data[index + 3] = 255; // A	
}

function paintRenderCanvas() {
	if (curveImage.width === 0 || curveImage.height === 0) {
		return;
	}
	
	var noOfPoints = curve.points.length;
	if (noOfPoints < 2) {
		return;
	}
	
	var context = renderCanvas.getContext("2d");
	var srcData = getSourceImageData(curveImage);
	var dstData = context.createImageData(renderCanvas.width, renderCanvas.height);
	var centerY = (renderCanvas.height / 2) | 0; // convert result to integer
	var rgb = [0, 0, 255];
	
	var x = 0;	
	for (var i = 0; i < noOfPoints - 1; i++) {
		var p0 = curve.points[i];
		var p1 = curve.points[i + 1];
		for (var u = 0; u <= 1; u += 0.01) {
			var pointOnCurve = Curves.Hermite.interpolateSegment(p0, p1, u);
			var tangentForPoint = Curves.Hermite.interpolateTangent(p0, p1, u);
			
			for (var y = 0; y < dstData.height; y++) {
				var distanceAlongTangent = centerY - y;
				var scaledTangent = new THREE.Vector2().copy(tangentForPoint).multiplyScalar(distanceAlongTangent);
				var samplePoint = new THREE.Vector2().copy(pointOnCurve).add(scaledTangent);
				getPixel(srcData, samplePoint.x, samplePoint.y, rgb);			
				setPixel(dstData, x, y, rgb);
			}
			
			x++;
		}
	}
	
	context.putImageData(dstData, 0, 0);
}

function paint() {
	paintCurveCanvas();
	paintRenderCanvas();
}

function resize() {
	var content = $("#content");
	canvas.width = content.width();
	canvas.height = content.height();

	var render = $("#render");
	renderCanvas.width = render.width();
	renderCanvas.height = render.height();
	
	paint();	
}

function loadImage(e: any) {
	var filelist: FileList = e.target.files;
	if (filelist.length == 0) {
		return;	
	}
	
	var file = filelist[0];
	
	var reader = new FileReader();
	reader.onload = function (e: any) {
		curveImage.src = e.target.result;
	};
	
	reader.readAsDataURL(file);
}

$(function () {
	curveImage.onload = resize;
	
	curve = new Curves.Hermite();
	curve.addPoint(100, 100, 0, 10);
	curve.addPoint(150, 150, -10, -10);
	curve.addPoint(170, 90, 20, 10);
	curve.addPoint(200, 90, 15, 25);
	curve.addPoint(270, 200, 40, 0);
	curve.addPoint(130, 300, 0, -40);
	
	curve.generateTangentsNaturalSpline();
	curve.generateCurve();
	
	canvas = <HTMLCanvasElement>$("#mainCanvas").get(0);
	renderCanvas = <HTMLCanvasElement>$("#renderCanvas").get(0);
	
	resize();
	
	$("#loadSourceImage").on("change", loadImage);
});

$(window).resize(resize);