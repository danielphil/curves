/// <reference path="../typings/threejs/three.d.ts" />
/// <reference path="../typings/jquery.d.ts" />
/// <reference path="View.ts" />

module Curves {
	export class CanvasCurveView extends View
	{
		private canvas : HTMLCanvasElement;
		private image = new Image();
		
		constructor(container: HTMLElement) {
			super(container);
			
			var width = $(container).width();
			var height = $(container).height();
			
			this.canvas = document.createElement("canvas");
			this.canvas.width = width;
			this.canvas.height = height;
			container.appendChild(this.canvas);
			
			this.render();
		}
		
		setImage(image: HTMLImageElement) {
			this.image = image;
			this.render();
		}
		
		protected resize() {
			this.canvas.width = $(this.container).width();
			this.canvas.height = $(this.container).height();
			
			this.render();
		}
		
		protected render() {
			var context = this.canvas.getContext("2d");
			context.drawImage(this.image, 0, 0);
			
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
	}
}