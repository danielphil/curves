/// <reference path="../typings/jquery.d.ts" />
/// <reference path="../typings/threejs/three.d.ts" />
/// <reference path="AddPointTool.ts" />
/// <reference path="CanvasView.ts" />
/// <reference path="Hermite.ts" />
/// <reference path="PanTool.ts" />

module Curves {
	export class CurveEditView extends CanvasView
	{
		private image = new Image();
		private curve = new Curves.Hermite();
		private addPointTool: AddPointTool;
        private panTool: PanTool;
        private pan = new THREE.Vector2();
        
        constructor(container: HTMLElement, curve: Hermite) {
            super(container);
            this.curve = curve;
            this.addPointTool = new Curves.AddPointTool(curve, (x, y) => new THREE.Vector2(x, y).sub(this.imageOffset()));
            this.panTool = new Curves.PanTool((pan) => {
                this.pan.add(pan);
                this.render();
            });
        }
		
		setImage(image: HTMLImageElement) {
			this.image = image;
            this.activateAddPoint();
            this.pan = new THREE.Vector2();
            
            this.render();
		}
        
		render() {
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
				
				context.strokeStyle = "black";
				context.beginPath();
				context.moveTo(point.position.x, point.position.y);
				context.lineTo(point.position.x + point.tangent.x, point.position.y + point.tangent.y);
				context.stroke();
			});
			
			if (this.curve.curvePoints.length >= 2) {
				context.strokeStyle = "red";
				context.beginPath();
				var p0: THREE.Vector2 = this.curve.curvePoints[0];
				context.moveTo(p0.x, p0.y);
				
				for (var i = 1; i < this.curve.curvePoints.length; i++) {
					context.lineTo(this.curve.curvePoints[i].x, this.curve.curvePoints[i].y);
				}
		
				context.stroke();
				
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
            
            context.restore();
		}
        
        private imageOffset() {
            var originToCanvasCentre = new THREE.Vector2(this.canvas.width / 2, this.canvas.height / 2);
			var imageCentreToOrigin = new THREE.Vector2(-this.image.width / 2, -this.image.height / 2);
			return new THREE.Vector2().copy(this.pan).add(originToCanvasCentre).add(imageCentreToOrigin);
        }
        
        activateAddPoint() {
            if (!this.image.src) {
                return;
            }
            
            this.changeActiveTool(this.addPointTool);
        }
        
        activatePan() {
            if (!this.image.src) {
                return;
            }
            
            this.changeActiveTool(this.panTool);
        }
	}
}