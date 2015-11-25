/// <reference path="CanvasView.ts" />
/// <reference path="Hermite.ts" />

module Curves {
	export class CanvasCurveRenderView extends CanvasView
	{
		private image = new Image();
		private curve = new Curves.Hermite();
		
		setImage(image: HTMLImageElement) {
			this.image = image;
			this.render();
		}
		
		setCurve(curve: Curves.Hermite) {
			this.curve = curve;
		}
		
		render() {
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
			var centerY = (this.canvas.height / 2) | 0; // convert result to integer
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
		}
		
		private getPixel(srcData: ImageData, x: number, y: number, rgb: number[]) {
			var xInt = x | 0;
			var yInt = y | 0;
			if (xInt < 0 || xInt >= srcData.width || yInt < 0 || yInt >= srcData.height) {
				rgb[0] = 0;
				rgb[1] = 0;
				rgb[2] = 0;
			} else {
				var index = 4 * (xInt + yInt * srcData.width);
				rgb[0] = srcData.data[index]; // R
				rgb[1] = srcData.data[index + 1]; // G
				rgb[2] = srcData.data[index + 2]; // B
			}
		}

		private setPixel(dstData: ImageData, x: number, y: number, rgb: number[]) {
			var index = 4 * (x + y * dstData.width);
			dstData.data[index] = rgb[0]; // R
			dstData.data[index + 1] = rgb[1]; // G
			dstData.data[index + 2] = rgb[2]; // B
			dstData.data[index + 3] = 255; // A	
		}
		
		private getSourceImageData(image: HTMLImageElement) {
			var tmpCanvas = document.createElement("canvas");
			tmpCanvas.width = image.width;
			tmpCanvas.height = image.height;
			var context = tmpCanvas.getContext("2d");
			context.drawImage(image, 0, 0);
			return context.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height);
		}
	}
}