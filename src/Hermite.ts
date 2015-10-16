module Curves {
	export interface HermiteControlPoint {
		position: THREE.Vector2;
		tangent: THREE.Vector2;
	} 
	export class Hermite
	{
		points: HermiteControlPoint[] = [];
		curvePoints: THREE.Vector2[] = [];
		
		addPoint(x: number, y: number, x_t: number, y_t: number) {
			this.points.push({
				position: new THREE.Vector2(x, y),
				tangent: new THREE.Vector2(x_t, y_t)
			});
		}
		
		private static clamp(val: number) : number {
			if (val < 0) {
				return 0;
			} else if (val > 1) {
				return 1;
			} else {
				return val;
			}
		}
		
		private static interp(u: number, P0: number, P1: number, PT0: number, PT1: number) {
			var u3 = Math.pow(u, 3);
			var u2 = Math.pow(u, 2);
			
			return (2 * u3 - 3 * u2 + 1) * P0 + (-2 * u3 + 3 * u2) * P1 + (u3 - 2 * u2 + u) * PT0 + (u3 - u2) * PT1;
		}
		
		private static interpolateSegment(cp0: HermiteControlPoint, cp1: HermiteControlPoint, t: number) {
			var p0 = cp0.position;
			var pT0 = cp0.tangent;
			var p1 = cp1.position;
			var pT1 = cp1.tangent;
			
			t = Hermite.clamp(t);
			
			return new THREE.Vector2(
				Hermite.interp(t, p0.x, p1.x, pT0.x, pT1.x),
				Hermite.interp(t, p0.y, p1.y, pT0.y, pT1.y)
			);
		}
		
		generateCurve() {
			this.curvePoints = [];
			var noOfPoints = this.points.length;
			if (noOfPoints < 2) {
				return;
			}
			
			for (var i = 0; i < noOfPoints - 1; i++) {
				var p0 = this.points[i];
				var p1 = this.points[i + 1];
				for (var u = 0; u <= 1; u += 0.1) {
					this.curvePoints.push(Hermite.interpolateSegment(p0, p1, u));
				}
			}
		}
	}
}