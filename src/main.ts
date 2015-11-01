/// <reference path="../typings/threejs/three.d.ts" />
/// <reference path="../typings/jquery.d.ts" />
/// <reference path="Hermite.ts" />

var canvas : HTMLCanvasElement;
var curve : Curves.Hermite;

function paint() {
	var context = canvas.getContext("2d");
	
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

function resize() {
	var content = $("#content");
	canvas.width = content.width();
	canvas.height = content.height();

	paint();	
}

$(function () {
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
	resize();
});

$(window).resize(resize);