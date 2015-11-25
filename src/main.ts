/// <reference path="../typings/threejs/three.d.ts" />
/// <reference path="../typings/jquery.d.ts" />
/// <reference path="CanvasCurveView.ts" />
/// <reference path="CanvasCurveRenderView.ts" />
/// <reference path="CurveView.ts" />
/// <reference path="Hermite.ts" />

var curveImage = new Image();
var canvasCurveView : Curves.CanvasCurveView;
var canvasCurveRenderView : Curves.CanvasCurveRenderView;

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
	curveImage.onload = function () {
		canvasCurveView.setImage(curveImage);
		canvasCurveRenderView.setImage(curveImage);
	}
	
	var curve = new Curves.Hermite();
	curve.addPoint(100, 100, 0, 10);
	curve.addPoint(150, 150, -10, -10);
	curve.addPoint(170, 90, 20, 10);
	curve.addPoint(200, 90, 15, 25);
	curve.addPoint(270, 200, 40, 0);
	curve.addPoint(130, 300, 0, -40);
	
	curve.generateTangentsNaturalSpline();
	curve.generateCurve();
	
	canvasCurveView = new Curves.CanvasCurveView($('#content').get(0));
	canvasCurveRenderView = new Curves.CanvasCurveRenderView($("#render").get(0));
	
	canvasCurveView.setCurve(curve);
	canvasCurveView.render();
	
	canvasCurveRenderView.setCurve(curve);
	canvasCurveRenderView.render();
	
	$("#loadSourceImage").on("change", loadImage);
});