// Utility Formulas

// Area of a polygon by applying the shoelace formula
function polyArea(vertices, signed=false) {
	let a = 0
	let len = vertices.length;
	for (let i = 0; i < len; i++) {
		let v1 = vertices[i]
		let v2 = vertices[(i + 1 + len) % len]
		a += (v1.y + v2.y) * (v1.x - v2.x) / 2
	}
	return signed ? a : Math.abs(a)
}

// Overlap size between two projections
function overlap(a, b) {
	if (a[0] >= b[1] || b[0] >= a[1]) return 0
	return Math.min(a[1], b[1]) - Math.max(a[0], b[0])
}

// 2D vector class
class Vector2 {
	
	constructor(x=0, y=0) {
		this.x = x
		this.y = y
	}
	
	// Arithmetic operations
	
	add(that) {
		return new Vector2(this.x + that.x, this.y + that.y)
	}
	
	subtract(that) {
		return new Vector2(this.x - that.x, this.y - that.y)
	}
	
	multiply(scalar) {
		return new Vector2(this.x * scalar, this.y * scalar)
	}
	
	divide(scalar) {
		if (scalar === 0) return new Vector2()
		return new Vector2(this.x / scalar, this.y / scalar)
	}
	
	// Products
	
	dot(that) {
		return this.x * that.x + this.y * that.y
	}
	
	cross(that) {
		return this.x * that.y - this.y * that.x
	}

	scalarCross(scalar) {
		return new Vector2(-scalar * this.y, scalar * this.x)
	}
	
	// Angle
	
	theta() {
		return Math.atan2(this.y, this.x)
	}

	rotate(alpha) {
		let theta = this.theta()
		let beta = alpha + theta
		let mag = this.magnitude()
		let x = mag * Math.cos(beta)
		let y = mag * Math.sin(beta)
		return new Vector2(x, y)
	}
	
	// Scale operations
	
	magnitude() {
		return Math.sqrt(this.x ** 2 + this.y ** 2)
	}
	
	normalize() {
		const mag = this.magnitude()
		if (mag === 0) return new Vector2()
		return new Vector2(this.x / mag, this.y / mag)
	}
	
	// Perpendicular vector
	
	perp() {
		return new Vector2(-this.y, this.x)
	}
}

// Global parameters
var rbs = []
var g = new Vector2(0, -10)
var timescale = 1

// Rigidbody class (physics object)
class Rigidbody {
	
	constructor(mass=0, pos=null, theta=0, shape={type: 'Ball', radius: 1}, bounce=0.5, vel=null, angVel=0) {
		// Main physical properties
		this.mass = mass
		this.pos = pos || new Vector2()
		this.vel = vel || new Vector2()

		// Force storage
		this.force = new Vector2()
		this.torque = 0

		// Shape properties
		this.shape = shape
		this.bounce = bounce
		this.shape.centroid = this.centroid()
		if (this.shape.type == 'Polygon') {
			for (let i = 0; i < this.shape.vertices.length; i++) {
				let vertex = this.shape.vertices[i]
				this.shape.vertices[i] = vertex.subtract(this.shape.centroid)
			}
		}
		this.triangulate()

		// Angular properties
		this.theta = theta
		this.angVel = angVel
		this.inertia = this.getInertia()
		
		// Internal sleep counter
		this.sleep = 0

		// Add to global rigidbody storage
		rbs.push(this)
	}
	
	asleep() {
		return this.sleep > 10
	}
	
	wake() {
		this.sleep = 0
	}
	
	// Update positions each frame
	update(dt=0) {
		if (this.mass === 0 || this.asleep()) return
		
		let gMag = g.magnitude()
		let vSleep = dt * gMag / 100
		let aSleep = dt * 10
		let damp = (1 - dt / 100)
		
		// Add gravity vector
		this.force = this.force.add(g.multiply(this.mass))
		
		let f_impulse = this.force.multiply(dt)
		this.addImpulse(f_impulse)
		let velMag = this.vel.magnitude()
		if (velMag < vSleep) {
			this.vel = new Vector2()  // Clamp velocity
		}
		else if (velMag < vSleep * 10) {
			this.vel = this.vel.multiply(damp)  // Damp velocity
		}
		this.pos = this.pos.add(this.vel.multiply(dt))
		
		this.angVel += this.torque * dt / this.inertia
		let absAng = Math.abs(this.angVel)
		if (absAng < aSleep) {
			this.angVel = 0  // Clamp angular velocity
		}
		else if (absAng < aSleep * 10) {
			this.angVel *= damp  // Damp angular velocity
		}
		this.theta += this.angVel * dt
		
		if (absAng < aSleep && velMag < vSleep) {
			this.sleep += 1
		}
		else {
			this.sleep = 0
		}
		
		this.force = new Vector2()
		this.torque = 0
	}

	// Convert local vertex to world space
	convertToWorld(point=null) {
		if (point == null) return
		// Rotate point
		let rotated = point.rotate(this.theta)
		return this.pos.add(rotated)  // Return translated point
	}
	
	// Gets the object's bounding box
	getBoundingBox() {
		// We want to find the extremes for the box
		let minX = Infinity; let maxX = -Infinity;
		let minY = Infinity; let maxY = -Infinity;
		if (this.shape.type == 'Ball') {
			let radius = this.shape.radius
			// Extremes are tangent to the circle and perpendicular to the x and y axes
			minX = this.pos.x - radius
			maxX = this.pos.x + radius
			minY = this.pos.y - radius
			maxY = this.pos.y + radius
		}
		else if (this.shape.type == 'Polygon') {
			let vertices = this.shape.vertices
			// Take extreme values found across all vertices
			for (let i = 0; i < vertices.length; i++) {
				let v = this.convertToWorld(vertices[i])
				minX = Math.min(v.x, minX)
				maxX = Math.max(v.x, maxX)
				minY = Math.min(v.y, minY)
				maxY = Math.max(v.y, maxY)
			}
		}
		// Return extremes
		return [minX, maxX, minY, maxY]
	}
	
	// Adds an impulse to the object
	addImpulse(impulse=null, point=null) {
		if (this.mass === 0) return
		let worldCentroid = this.convertToWorld(this.shape.centroid)
		impulse = impulse || new Vector2()
		point = point || worldCentroid

		// Linear velocity
		this.vel = this.vel.add(impulse.divide(this.mass))

		// Angular velocity
		let bp = point.subtract(worldCentroid)
		let v = bp.cross(impulse)
		this.angVel += v / this.inertia
	}
	
	// Predict the difference in angular velocity
	predictAngVel(impulse=null, point=null) {
		if (this.mass === 0) return 0
		let worldCentroid = this.convertToWorld(this.shape.centroid)
		impulse = impulse || new Vector2()
		point = point || worldCentroid
		
		let bp = point.subtract(worldCentroid)
		let v = bp.cross(impulse)
		return v / this.inertia
	}
	
	// Calculates the center of mass (local)
	centroid() {
		if (this.shape.type == 'Ball') {
			return new Vector2(0, 0)
		}
		else if (this.shape.type == 'Polygon') {
			let xSum = 0
			let ySum = 0
			let len = this.shape.vertices.length
			for (let i = 0; i < len; i++) {
				let v1 = this.shape.vertices[i]
				let v2 = this.shape.vertices[(i + 1 + len) % len]
				xSum += (v1.x + v2.x) * v1.cross(v2)
				ySum += (v1.y + v2.y) * v1.cross(v2)
			}
			let A = polyArea(this.shape.vertices, true)
			xSum /= 6 * A
			ySum /= 6 * A
			return new Vector2(xSum, ySum)
		}
	}

	getInertia() {
		if (this.mass === 0) return 0
		if (this.shape.type == 'Ball') {
			return this.mass * this.shape.radius ** 2 / 2
		}
		else if (this.shape.type == 'Polygon') {
			let triangles = this.shape.triangles
			let A = polyArea(this.shape.vertices)
			let sumInertia = 0
			for (let i = 0; i < triangles.length; i++) {
				let triangle = triangles[i]
				let t1 = triangle[0]
				let t2 = triangle[1]
				let t3 = triangle[2]
				let m = this.mass * polyArea(triangle) / A
				let calc = t1.x ** 2 + t2.x ** 2 + t3.x ** 2 + t1.y ** 2 + t2.y ** 2 + t3.y ** 2 + (t1.x + t2.x + t3.x) ** 2 + (t1.y + t2.y + t3.y) ** 2
				sumInertia += calc * m / 12
			}
			return sumInertia
		}
	}
	
	// Triangulates the rigidbody for collision calculations
	triangulate() {
		if (this.shape.type != 'Polygon') return false
		let triangles = []
		let purgatory = []
		for (let i = 0; i < this.shape.vertices.length; i++) {
			let vertex = this.shape.vertices[i]
			purgatory.push(new Vector2(vertex.x, vertex.y))
		}
		while (purgatory.length > 3) {
			// Ear finding phase
			let len = purgatory.length;
			let toRemove = null
			let ears = []
			for (let i = 0; i < len; i++) {
				// Gather 3 consecutive vertices
				let a = purgatory[(i - 1 + len) % len]
				let b = purgatory[i]
				let c = purgatory[(i + 1 + len) % len]
				
				// Create vectors pointing from middle vertex to the outer ones
				let va = a.subtract(b)
				let vc = c.subtract(b)
				
				// Use cross product formula to determine if the angle is convex
				let cross = va.cross(vc)
				if (cross > 0) {
					let ear = true
					// Checking phase (if there are other vertices inside)
					let goal = polyArea([a, b, c])
					for (let j = 0; j < len; j++) {
						let v = purgatory[j]
						if (v == a || v == b || v == c) continue
						let a1 = polyArea([v, b, c])
						let a2 = polyArea([a, v, c])
						let a3 = polyArea([a, b, v])
						if (a1 + a2 + a3 <= goal + 0.001) {
							ear = false
							break
						}
					}
					if (ear) {
						ears.push([[a, b, c], i])
					}
				}
			}
			let best = -Infinity
			let selected = null
			for (let i = 0; i < ears.length; i++) {
				let ear = ears[i]
				let tri = ear[0]
				let p = 0
				for (let x = 0; x < tri.length; x++) {
					for (let y = x + 1; y < tri.length; y++) {
						let v1 = tri[x]; let v2 = tri[y];
						let diff = v2.subtract(v1)
						p += diff.magnitude()
					}
				}
				let a = polyArea(tri)
				let frac = a / p ** 2
				if (frac > best) {
					best = frac
					selected = ear
				}
			}
			if (selected != null) {
				triangles.push(selected[0])
				purgatory.splice(selected[1], 1)
			}
			else {
				purgatory = null
				break
			}
		}
		if (purgatory == null) {
			return false
		}
		triangles.push(purgatory)
		this.shape.triangles = triangles
		return true
	}
	
	// Projects the rigidbody's vertices onto a normalized axis for the SAT
	project(ax, vertices=null) {
		// Normalize axis for dot product calculations
		ax = ax.normalize()
		if (this.shape.type == 'Ball') {
			// Set target points as those opposite on the circle on the axis
			let v1 = this.pos.add(ax.multiply(this.shape.radius))
			let v2 = this.pos.subtract(ax.multiply(this.shape.radius))
			// Get dot products
			let dot1 = v1.dot(ax)
			let dot2 = v2.dot(ax)
			return [Math.min(dot1, dot2), Math.max(dot1, dot2)]
		}
		else if (this.shape.type == 'Polygon') {
			let target = vertices || this.shape.vertices
			let min = Infinity
			let max = -Infinity
			for (let i = 0; i < target.length; i++) {
				// Calculate projection for each vertex
				let v = this.convertToWorld(target[i])
				let dot = v.dot(ax)
				if (dot < min) {
					min = dot
				}
				if (dot > max) {
					max = dot
				}
			}
			return [min, max]
		}
	}
	
	// Gets the perpendicular axes to project onto
	getPerpAxes(vertices=null) {
		if (this.shape.type != 'Polygon') return false
		let target = vertices || this.shape.vertices
		let axes = []
		for (let i = 0; i < target.length; i++) {
			let v1 = this.convertToWorld(target[i])
			let v2 = this.convertToWorld(target[(i + 1 + target.length) % target.length])
			let edge = v2.subtract(v1)
			axes.push(edge.perp().normalize())
		}
		return axes
	}
	
}

// Filters collisions based on whether or not they are possible to improve execution
function filterCollision(a, b) {
	// Exclude obvious false cases
	if (a.mass === 0 && b.mass === 0) return false
	if (a.asleep() && b.asleep()) return false
	
	let bA = a.getBoundingBox()
	let bB = b.getBoundingBox()
	
	let xMinA = bA[0]; let xMaxA = bA[1]; let yMinA = bA[2]; let yMaxA = bA[3];
	let xMinB = bB[0]; let xMaxB = bB[1]; let yMinB = bB[2]; let yMaxB = bB[3];
	
	let xCondit = (xMaxA > xMinB) && (xMaxB > xMinA)
	let yCondit = (yMaxA > yMinB) && (yMaxB > yMinA)
	
	return xCondit && yCondit
}

// Detects collisions and returns the normal and overlap depth
function detectCollision(a, b) {
	let a_ball = a.shape.type == 'Ball'
	let b_ball = b.shape.type == 'Ball'
	
	let maxDepth = 1
		
	// Ball-on-ball collision
	if (a_ball && b_ball) {
		// Calculate sum of radiuses, being, the max distance where they don't touch
		let combined_rad = a.shape.radius + b.shape.radius
		let pos_diff = b.pos.subtract(a.pos)
		let mag = pos_diff.magnitude()
		let norm = pos_diff.normalize()
		let dep = combined_rad - mag
		
		// Determine if the distance between them is less than this max
		if (mag < combined_rad) {
			return {
				normal: norm,
				depth: Math.min(dep, maxDepth),
				point: [a.pos.add(norm.multiply(a.shape.radius - dep/2))]
			}
		}
	}
	
	// Polygon-on-ball collision
	else if (a_ball || b_ball) {
		let ball = a_ball ? a : b
		let poly = a_ball ? b : a
		let triangles = poly.shape.triangles
		let globalAx = null
		let globalMax = -Infinity
		for (let i = 0; i < triangles.length; i++) {
			let triangle = triangles[i]
			let axes = poly.getPerpAxes(triangle)
			let closestVertex = poly.convertToWorld(triangle[0])
			let minDist = closestVertex.subtract(ball.pos).magnitude()
			for (let j = 1; j < triangle.length; j++) {
				let v = poly.convertToWorld(triangle[j])
				let dist = v.subtract(ball.pos).magnitude()
				if (dist < minDist) {
					closestVertex = v
					minDist = dist
				}
			}
			let pointAx = ball.pos.subtract(closestVertex)
			axes.push(pointAx.normalize())
			let min = Infinity
			let bestAx = null
			for (let x = 0; x < axes.length; x++) {
				let ax = axes[x]
				let p1 = ball.project(ax)
				let p2 = poly.project(ax, triangle)
				let depth = overlap(p1, p2)
				if (depth === 0) {
					bestAx = null
					break
				}
				else if (Math.abs(depth) < min) {
					min = Math.abs(depth)
					bestAx = ax
				}
			}
			if (bestAx != null) {
				let center = b.convertToWorld(b.shape.centroid).subtract(a.convertToWorld(a.shape.centroid))
				if (bestAx.dot(center) < 0) {
					bestAx = bestAx.multiply(-1)
				}
				if (min > globalMax) {
					globalMax = min
					globalAx = bestAx
				}
			}
		}
		if (globalAx != null) {
			globalMax = Math.min(globalMax, maxDepth)
			let point = null
			if (a_ball) {
				point = a.pos.add(globalAx.multiply(a.shape.radius - globalMax/2))
			}
			else {
				point = b.pos.subtract(globalAx.multiply(b.shape.radius - globalMax / 2))
			}
			return {
				normal: globalAx,
				depth: globalMax,
				point: [point]
			}
		}
	}
	
	// Polygon-on-polygon collision
	else {
		// Gather axis for SAT comparison
		let a_triangles = a.shape.triangles
		let b_triangles = b.shape.triangles
		let globalAx = null
		let globalMax = -Infinity
		let notOwner = null
		let notObject = null
		for (let i = 0; i < a_triangles.length; i++) {
			for (let j = 0; j < b_triangles.length; j++) {
				let min = Infinity
				let foundX = 0
				let bestT1 = null
				let bestT2 = null
				let bestAx = null
				let axes = []
				let aAxes = a.getPerpAxes(a_triangles[i])
				let bAxes = b.getPerpAxes(b_triangles[j])
				axes.push(...aAxes)
				axes.push(...bAxes)
				for (let x = 0; x < axes.length; x++) {
					let ax = axes[x]
					let t1 = a_triangles[i]
					let t2 = b_triangles[j]
					let p1 = a.project(ax, t1)
					let p2 = b.project(ax, t2)
					let depth = overlap(p1, p2)
					if (depth === 0) {
						bestAx = null
						break
					}
					else if (Math.abs(depth) < min) {
						min = Math.abs(depth)
						bestAx = ax
						foundX = x
						bestT1 = t1
						bestT2 = t2
					}
				}
				if (bestAx != null) {
					let center = b.convertToWorld(b.shape.centroid).subtract(a.convertToWorld(a.shape.centroid))
					if (bestAx.dot(center) < 0) {
						bestAx = bestAx.multiply(-1)
					}
					if (min > globalMax) {
						globalMax = min
						globalAx = bestAx
						notOwner = foundX < aAxes.length ? bestT2 : bestT1
						notObject = foundX < aAxes.length ? b : a
					}
				}
			}
		}
		if (globalAx != null) {
			globalMax = Math.min(globalMax, maxDepth)
			let mins = []
			let currentMin = Infinity
			let slop = 0.001
			for (let i = 0; i < notOwner.length; i++) {
				let v = notObject.convertToWorld(notOwner[i])
				let dot = v.dot(globalAx)
				if (dot < currentMin - slop) {
					currentMin = dot
					mins = [v]
				}
				else if (dot < currentMin + slop) {
					mins.push(v)
				}
			}
			return {
				normal: globalAx,
				depth: globalMax,
				point: mins
			}
		}
	}

	// Return false if no collision is found
	return false
}

// Corrects the overlap caused by collisions
function correctCollision(a, b, info) {
	// Gather inverse masses for later calculations
	let a_inv = a.mass === 0 ? 0 : 1 / a.mass
	let b_inv = b.mass === 0 ? 0 : 1 / b.mass
	let total_inv = a_inv + b_inv
	
	// Return if two immovable masses
	if (total_inv === 0) return
	
	// Parameters for collision correction
	let slop = 0.01
	let frac = 0.2
	
	// Calculate vector to separate objects
	let mag = frac * Math.max(info.depth - slop, 0) / total_inv
	let vector = info.normal.multiply(mag)
	
	// Add relevant vectors scaled by inverse mass
	a.pos = a.pos.subtract(vector.multiply(a_inv))
	b.pos = b.pos.add(vector.multiply(b_inv))
}

// Resolves collisions by adding impulses
function resolveCollision(a, b, info) {
	// Gather inverse masses for later
	let a_inv = a.mass === 0 ? 0 : 1 / a.mass
	let b_inv = b.mass === 0 ? 0 : 1 / b.mass
	let total_inv = a_inv + b_inv
	
	// Ignore collisions between two immovable masses
	if (total_inv === 0) return

	// Calculate restitution for later
	let restitution = a.bounce * b.bounce

	// Calculate centroids
	let aCenter = a.convertToWorld(a.shape.centroid)
	let bCenter = b.convertToWorld(b.shape.centroid)

	// Do for each contact point equally
	let amt = info.point.length
	let iters = amt < 2 ? 1 : 5
	
	// Calculate target velocities for each point
	let targets = []
	for (let i = 0; i < amt; i++) {
		let point = info.point[i]
		let bpA = point.subtract(aCenter)
		let bpB = point.subtract(bCenter)
		
		// Dot product to later scale for collision impulse
		let a_vel = a.vel.add(bpA.scalarCross(a.angVel))
		let b_vel = b.vel.add(bpB.scalarCross(b.angVel))
		let vel_diff = b_vel.subtract(a_vel)
		
		targets.push(vel_diff.multiply(-restitution).dot(info.normal))
	}
	let acc = new Array(amt).fill(0)
	
	for (let iter = 0; iter < iters; iter++)
	{
		for (let i = 0; i < amt; i++) {
			let point = info.point[i]
			let bpA = point.subtract(aCenter)
			let bpB = point.subtract(bCenter)
		
			// Dot product to later scale for collision impulse
			let a_vel = a.vel.add(bpA.scalarCross(a.angVel))
			let b_vel = b.vel.add(bpB.scalarCross(b.angVel))
			let vel_diff = b_vel.subtract(a_vel)
			
			let impulse = vel_diff.dot(info.normal)
			let target = targets[i]
			
			// Ignore objects already moving away from each other
			if (impulse > target) continue
			
			let f = target - impulse
			
			// Finalize impulse magnitute calculation
			let this_inv = total_inv
			if (a.inertia > 0) this_inv += (bpA.cross(info.normal) ** 2) / a.inertia
			if (b.inertia > 0) this_inv += (bpB.cross(info.normal) ** 2) / b.inertia
			f /= this_inv
			
			let app = Math.max(0, acc[i] + f)
			let imp = app - acc[i]
			acc[i] = app
					
			// Add relevant impulses
			a.addImpulse(info.normal.multiply(-imp), point)
			b.addImpulse(info.normal.multiply(imp), point)
		}
	}
}

// Calculate one physics step
function step(dt) {
	// Update phase
	for (let i = 0; i < rbs.length; i++) {
		rbs[i].update(dt * timescale)
	}
	// Collision detection phase (loop through all pairs of rigidbodies)
	for (let i = 0; i < rbs.length; i++) {
		for (let j = i + 1; j < rbs.length; j++) {
			let a = rbs[i]
			let b = rbs[j]
			
			// Determine if collision can even be considered
			if (filterCollision(a, b)) {
				let info = detectCollision(a, b)
				// If collision is valid
				if (info) {
					a.wake(); b.wake();
					correctCollision(a, b, info)
					resolveCollision(a, b, info)
				}
			}
		}
	}
}

// Calculate multiple physics steps (used for rendering)
function multiStep(dt, count=1) {
	let smallDt = dt / count
	for (let i = 0; i < count; i++) {
		step(smallDt)
	}
}
