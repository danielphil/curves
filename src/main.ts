/// <reference path="../typings/threejs/three.d.ts" />
/// <reference path="../typings/jquery.d.ts" />
/// <reference path="CanvasCurveView.ts" />
/// <reference path="CanvasCurveRenderView.ts" />
/// <reference path="CurveEditView.ts" />
/// <reference path="Hermite.ts" />

var curveImage = new Image();
var curveEditView : Curves.CurveEditView;
var curveRenderView : Curves.CanvasCurveRenderView;

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
		curveEditView.setImage(curveImage);
		curveRenderView.setImage(curveImage);
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
	
	curveEditView = new Curves.CurveEditView($('#content').get(0));
	curveRenderView = new Curves.CanvasCurveRenderView($("#render").get(0));
	
	curveEditView.setCurve(curve);
	curveEditView.render();
	
	curveRenderView.setCurve(curve);
	curveRenderView.render();
	
	$("#loadSourceImage").on("change", loadImage);
});