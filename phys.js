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
		// Multiply by standard 2D rotation matrix
		let sin = Math.sin(alpha)
		let cos = Math.cos(alpha)
		let x = this.x * cos - this.y * sin
		let y = this.x * sin + this.y * cos
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

// Rigidbody class (physics object)
class Rigidbody {
	
	constructor({mass=0, pos=null, theta=0, shape={type: 'Ball', radius: 1}, bounce=0.5, friction=0.5, angFriction=0.05, vel=null, angVel=0, ghost=false, canCollide=true, parent=null} = {}) {
		// Require parent
		if (!parent) {
			throw new Error('Object must have a parent engine!')
		}
		
		// Main physical properties
		this.mass = mass
		this.pos = pos || new Vector2()
		this.vel = vel || new Vector2()

		// Shape properties
		this.shape = shape
		this.bounce = bounce
		this.friction = friction
		this.angFriction = angFriction
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
		this.ghost = ghost
		this.canCollide = canCollide
		
		// For hashmaps
		this.hashIndexes = []
		this.id = parent.idCounter
		parent.idCounter++
		
		// Callbacks
		this.onCollide = null
		this.tags = {}
		this.constraints = []

		// Add to global rigidbody storage
		parent.rbs.push(this)
		this.parent = parent
	}

	// Remove a rigidbody from the engine
	destroy() {
		// Detach constraints attached to the rigidbody
		for (let i = this.constraints.length - 1; i >= 0; i--) {
			this.constraints[i].detach()
		}
		
		// Remove rb from the list
		let index = this.parent.rbs.indexOf(this)
		if (index > -1) {
			this.parent.rbs.splice(index, 1)
		}
	}

	// Check if a rigidbody is asleep
	asleep() {
		return this.sleep > 30
	}

	// Wake up the rigidbody from sleep
	wake() {
		this.sleep = 0
	}
	
	// Update positions each frame
	update(dt=0) {
		if (this.mass === 0 || this.asleep() || this.ghost) return
		
		let gMag = this.parent.g.magnitude()
		let vSleep = dt * gMag / 10
		let aSleep = dt * 5
		let damp = (1 - dt / 100)
		
		// Add gravity vector
		this.addForce(dt, this.parent.g.multiply(this.mass))
		
		let velMag = this.vel.magnitude()
		if (velMag < vSleep) {
			this.vel = new Vector2()  // Clamp velocity
		}
		else if (velMag < vSleep * 10) {
			this.vel = this.vel.multiply(damp)  // Damp velocity
		}
		this.pos = this.pos.add(this.vel.multiply(dt))
		
		let absAng = Math.abs(this.angVel)
		if (absAng < aSleep && this.constraints.length < 1) {
			this.angVel = 0  // Clamp angular velocity
		}
		else if (absAng < aSleep * 10 && this.constraints.length < 1) {
			this.angVel *= damp  // Damp angular velocity
		}
		this.theta += this.angVel * dt
		
		if (absAng < aSleep && velMag < vSleep) {
			this.sleep += 1
		}
		else {
			this.sleep = 0
		}
	}

	// Convert local vertex to world space
	convertToWorld(point=null) {
		point = point || new Vector2()
		// Rotate point
		let rotated = point.rotate(this.theta)
		return this.pos.add(rotated)  // Return translated point
	}
	
	// Adds an impulse to the object
	addImpulse(impulse=null, point=null) {
		if (this.mass === 0 || this.ghost) return
		let worldCentroid = this.convertToWorld()
		impulse = impulse || new Vector2()
		point = point || worldCentroid

		// Linear velocity
		this.vel = this.vel.add(impulse.divide(this.mass))

		// Angular velocity
		let bp = point.subtract(worldCentroid)
		let v = bp.cross(impulse)
		this.angVel += v / this.inertia
	}
	
	// Adds a force to the object relative to time
	addForce(dt, force=null, point=null) {
		force = force || new Vector2()
		this.addImpulse(force.multiply(dt), point)
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
						if (a1 + a2 + a3 < goal + 0.001) {
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
	
	// Check if a point is inside the rigidbody
	checkInside(point=null) {
		// Check cases
		point = point || new Vector2()
		if (this.shape.type == 'Ball') {
			// Ball case: Check if distance is less than radius
			let dist = this.pos.subtract(point).magnitude()
			return dist <= this.shape.radius
		}
		else if (this.shape.type == 'Polygon') {
			// Polygon case: Check if the point exists in any triangle
			let triangles = this.shape.triangles
			for (let i = 0; i < triangles.length; i++) {
				// Get triangle vertices
				let triangle = triangles[i]
				let a = this.convertToWorld(triangle[0])
				let b = this.convertToWorld(triangle[1])
				let c = this.convertToWorld(triangle[2])
				
				// Get all areas
				let goal = polyArea(triangle)
				let a1 = polyArea([a, b, point])
				let a2 = polyArea([a, point, c])
				let a3 = polyArea([point, b, c])
				
				// Check if sum of areas equals goal
				return a1 + a2 + a3 < goal + 0.001
			}
		}
		
		// Return false in some other case
		return false
	}
	
}

// Spring constraint
class Spring {
	
	constructor({a=null, b=null, posA=null, posB=null, k=1, damping=0.1, rest=1, coils=5, width=1, parent=null} = {}) {
		// Require parent
		if (!parent) {
			throw new Error('Object must have a parent engine!')
		}
		
		// Define rigid bodies
		this.a = a
		this.b = b
		this.pointA = posA || new Vector2()
		this.pointB = posB || new Vector2()
		
		// Set rigid bodies and points where the springs are attached
		if (!a) {
			this.a = new Rigidbody({
				mass: 0,
				ghost: true,
				pos: this.pointA,
				shape: {
					type: 'Ball',
					radius: 1
				},
				parent: parent
			})
			this.pointA = new Vector2()
		}
		else {
			if (posA) this.pointA = this.pointA.subtract(a.shape.centroid)
		}
		if (!b) {
			this.b = new Rigidbody({
				mass: 0,
				ghost: true,
				pos: this.pointB,
				shape: {
					type: 'Ball',
					radius: 1
				},
				parent: parent
			})
			this.pointB = new Vector2()
		}
		else {
			if (posB) this.pointB = this.pointB.subtract(b.shape.centroid)
		}
		
		// Constraint application
		this.a.constraints.push(this)
		this.b.constraints.push(this)
		
		// Spring constant and rest length
		this.k = k
		this.damping = damping
		this.coils = coils
		this.width = width
		this.rest = rest
		this.type = 'Spring'
		
		// Add to global constraint storage
		parent.consts.push(this)
		this.parent = parent
	}
	
	// Applies spring forces onto both objects
	update(dt) {
		// Get world points for spring action
		let worldA = this.a.convertToWorld(this.pointA)
		let worldB = this.b.convertToWorld(this.pointB)
		
		// Calculate force using F = -kx
		let diff = worldB.subtract(worldA)
		let extension = diff.magnitude() - this.rest
		
		// Get difference in velocity
		let bpA = this.a.convertToWorld(this.pointA).subtract(this.a.convertToWorld())
		let bpB = this.b.convertToWorld(this.pointB).subtract(this.b.convertToWorld())
		let a_vel = this.a.vel.add(bpA.scalarCross(this.a.angVel))
		let b_vel = this.b.vel.add(bpB.scalarCross(this.b.angVel))
		let vel_diff = b_vel.subtract(a_vel)
		
		// Get damping component
		let vel_dot = vel_diff.dot(diff.normalize())
		
		// Get force
		let force = diff.normalize().multiply(-this.k * extension - this.damping * vel_dot)
		
		// Apply forces in opposite directions
		this.a.addForce(dt, force.multiply(-1), worldA)
		this.b.addForce(dt, force, worldB)
	}
	
	// Kills the constraint
	detach() {
		// Find indexes of this constraint in each rigidbody
		let indexA = this.a.constraints.indexOf(this)
		let indexB = this.b.constraints.indexOf(this)
		
		// Remove constraint from said constraint lists
		if (indexA > -1) {
			this.a.constraints.splice(indexA, 1)
		}
		if (indexB > -1) {
			this.b.constraints.splice(indexB, 1)
		}
		
		// Remove constraint from the general list
		let indexC = this.parent.consts.indexOf(this)
		if (indexC > -1) {
			this.parent.consts.splice(indexC, 1)
		}
	}
	
}

// Filters collisions based on whether or not they are possible to improve execution
function filterCollision(a, b) {
	// Get bounding boxes
	let bA = a.getBoundingBox()
	let bB = b.getBoundingBox()
	
	// Get coordinates
	let xMinA = bA[0]; let xMaxA = bA[1]; let yMinA = bA[2]; let yMaxA = bA[3];
	let xMinB = bB[0]; let xMaxB = bB[1]; let yMinB = bB[2]; let yMaxB = bB[3];
	
	// Determine if coordinates overlap
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
				let center = b.convertToWorld().subtract(a.convertToWorld())
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
					let center = b.convertToWorld().subtract(a.convertToWorld())
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

	// Calculate restitution and friction for later
	let restitution = (a.bounce * b.bounce) ** 0.5
	let friction = (a.friction * b.friction) ** 0.5
	let angFriction = (a.angFriction * b.angFriction) ** 0.5

	// Calculate centroids
	let aCenter = a.convertToWorld()
	let bCenter = b.convertToWorld()

	// Do for each contact point equally
	let amt = info.point.length
	let iters = amt < 2 ? 1 : 5
	
	// Callback packages
	let aPack = {}; let bPack = {};
	aPack.normal = info.normal; bPack.normal = info.normal;
	aPack.points = info.point; bPack.points = info.point;
	aPack.vel0 = a.vel; bPack.vel0 = b.vel;
	aPack.angVel0 = a.angVel; bPack.angVel0 = b.angVel;
	
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
	let accF = new Array(amt).fill(0)
	let accR = new Array(amt).fill(0)
	
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
			
			// Get next add for accumulator
			let app = Math.max(0, acc[i] + f)
			let imp = app - acc[i]
			acc[i] = app
					
			// Add relevant impulses
			a.addImpulse(info.normal.multiply(-imp), point)
			b.addImpulse(info.normal.multiply(imp), point)
			
			// Re-calculate variables
			a_vel = a.vel.add(bpA.scalarCross(a.angVel))
			b_vel = b.vel.add(bpB.scalarCross(b.angVel))
			vel_diff = b_vel.subtract(a_vel)
			
			// Get tangent vector and speed for friction (and check if there's even friction at all)
			let tangent = info.normal.perp()
			let f_vel = vel_diff.dot(tangent)
			if (Math.abs(f_vel) < 0.0001) continue
			
			// Calculate denominator for tangent impulse
			let f_inv = total_inv
			if (a.inertia > 0) f_inv += (bpA.cross(tangent) ** 2) / a.inertia
			if (b.inertia > 0) f_inv += (bpB.cross(tangent) ** 2) / b.inertia
			let f_imp = -f_vel / f_inv
			
			// Get next add for tangent accumulator
			let maxF = acc[i] * friction
			let appF = Math.max(-maxF, Math.min(maxF, accF[i] + f_imp))
			f_imp = appF - accF[i]
			accF[i] = appF
			
			// Add relevant tangent impulses
			a.addImpulse(tangent.multiply(-f_imp), point)
			b.addImpulse(tangent.multiply(f_imp), point)
			
			// Add rotational friction
			if (angFriction === 0) continue
			
			// Get angular velocity difference
			let ang_diff = b.angVel - a.angVel
			if (Math.abs(ang_diff) < 0.0001) continue
			
			// Get "inverse mass" denominator
			let inv_inertia_A = a.inertia === 0 ? 0 : 1 / a.inertia
			let inv_inertia_B = b.inertia === 0 ? 0 : 1 / b.inertia
			let denominator = inv_inertia_A + inv_inertia_B
			if (denominator === 0) continue
			
			// Get impulse
			let r_imp = -ang_diff / denominator
			let max_r = acc[i] * angFriction
			let appR = Math.max(-max_r, Math.min(max_r, accR[i] + r_imp))
			r_imp = appR - accR[i]
			accR[i] = appR
			
			// Add impulses
			a.angVel -= r_imp * inv_inertia_A
			b.angVel += r_imp * inv_inertia_B
		}
	}
	
	// Log features for callback package
	aPack.vel1 = a.vel; bPack.vel1 = b.vel;
	aPack.angVel1 = a.angVel; bPack.angVel1 = b.angVel;
	let totalImpulse = 0
	let totalFriction = 0
	for (let i = 0; i < acc.length; i++) {
		totalImpulse += acc[i]
		totalFriction += accF[i]
	}
	aPack.impulse = totalImpulse; bPack.impulse = totalImpulse;
	aPack.friction = totalFriction; bPack.friction = totalFriction;
	
	// Send return packages for callbacks
	if (a.onCollide) a.onCollide(b, aPack)
	if (b.onCollide) b.onCollide(a, bPack)
}

// Actual physics objects
class SimplePhysJS {

	constructor({timescale=1, g=null, collide=true, cellSize=3} = {}) {
		// Important global parameters
		this.timescale = timescale
		this.g = g || new Vector2(0, -10)
		this.collide = collide
		this.cellSize = cellSize
		this.idCounter = 0
		
		// Object storage
		this.rbs = []
		this.consts = []
		
		// Metrics
		this.lastCheck = performance.now()
		this.stepSum = 0
		
		// Callbacks
		this.spsUpdate = null
		this.onStep = null
	}
	
	// Calculates SPS as a metric
	calculateSPS() {
		// Increment time and steps
		let now = performance.now()
		this.stepSum++
		
		// Check if a second passed
		if (now - this.lastCheck >= 1000) {
			// Reset and return step rate
			this.lastCheck = now
			if (this.spsUpdate) this.spsUpdate(this.stepSum)
			this.stepSum = 0
		}
	}
	
	// Return a spatial hash of all objects
	getHash() {
		let hash = {}
		// Loop through all objects to add them to hash
		for (let i = 0; i < this.rbs.length; i++) {
			// Setup rigidbody variables
			let rb = this.rbs[i]
			if (!rb.canCollide || rb.ghost) continue
			let boundingBox = rb.getBoundingBox()
			
			// Get edge coordinates for the object
			let minX = Math.floor(boundingBox[0] / this.cellSize)
			let maxX = Math.floor(boundingBox[1] / this.cellSize)
			let minY = Math.floor(boundingBox[2] / this.cellSize)
			let maxY = Math.floor(boundingBox[3] / this.cellSize)
			
			// Get indexes
			let indexes = []
			for (let x = minX; x <= maxX; x++) {
				for (let y = minY; y <= maxY; y++) {
					// Create unique hash and apply
					let index = 'x' + x.toString() + '_y' + y.toString()
					indexes.push(index)
					if (index in hash) {
						hash[index].push(rb)
					}
					else {
						hash[index] = [rb]
					}
				}
			}
			
			// Update rb indexes
			rb.hashIndexes = indexes
		}
		
		// Return final map
		return hash
	}
	
	// Get collision pairs from hash
	getCollPairs() {
		// Get spatial hash
		let hash = this.getHash()
		
		let pairs = []
		let pairSet = new Set()
		// Loop through keys in the hash
		let keys = Object.keys(hash)
		for (let k = 0; k < keys.length; k++) {
			// Get current key
			let key = keys[k]
			
			// Loop through all pairs of objects in the key
			for (let i = 0; i < hash[key].length; i++) {
				for (let j = i + 1; j < hash[key].length; j++) {
					// Get both rigidbodies
					let a = hash[key][i]
					let b = hash[key][j]
					
					// Exclude obvious false cases
					let excludeA = a.mass === 0 || a.asleep()
					let excludeB = b.mass === 0 || b.asleep()
					if (excludeA && excludeB) continue
					
					// Check if pair has been chosen using an id (sets take O(1) time)
					let pairId = a.id < b.id ? a.id.toString() + '_' + b.id.toString() : b.id.toString() + '_' + a.id.toString()
					if (!pairSet.has(pairId)) {
						// Push pair if valid
						pairs.push([a, b])
						pairSet.add(pairId)
					}
				}
			}
		}
		
		// Return final list
		return pairs
	}

	// Executes one physics step
	step(dt) {
		// Update phase
		for (let i = 0; i < this.rbs.length; i++) {
			this.rbs[i].update(dt * this.timescale)
		}
		
		// Collision detection phase (loop through all pairs of rigidbodies)
		if (this.collide) {
			let pairs = this.getCollPairs()
			for (let i = 0; i < pairs.length; i++) {
				let pair = pairs[i]
				let a = pair[0]
				let b = pair[1]
				
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
		
		// Update constraints
		for (let i = 0; i < this.consts.length; i++) {
			this.consts[i].update(dt * this.timescale)
		}
		
		// Update step metric
		this.calculateSPS(dt)
		
		// Do thing
		if (this.onStep) this.onStep(dt)
	}

	// Calculate multiple physics steps (used for rendering)
	multiStep(dt, count=1) {
		let smallDt = dt / count
		for (let i = 0; i < count; i++) {
			this.step(smallDt)
		}
	}
	
	// Apply radial impulse
	addRadialImpulse(pos=null, radius=10, power=10) {
		// Fix position if null
		pos = pos || new Vector2()
		
		// Iterate through all bodies
		for (let i = 0; i < this.rbs.length; i++) {
			// Check different shape types
			let rb = this.rbs[i]
			if (rb.shape.type == 'Ball') {
				// Get calculate vector from point to closest edge on the circle
				let distVector = rb.pos.subtract(pos)
				let returnVector = distVector.normalize().multiply(-rb.shape.radius)
				let sumVector = distVector.add(returnVector)
				let trueVector = sumVector
				
				// If edge vector is not in the same direction as the center vector resort to center vector
				if (rb.checkInside(pos)) {
					trueVector = distVector
					returnVector = new Vector2()
				}
				
				// Determine if collision is valid
				let dist = trueVector.magnitude()
				if (dist < radius) {
					// Add vector
					let normal = trueVector.normalize()
					let impulse = 1 - dist / radius
					normal = normal.multiply(impulse * power)
					rb.addImpulse(normal, rb.pos.add(returnVector))
				}
			}
			else if (rb.shape.type == 'Polygon') {
				// Get polygon vertices and define list for used closest points
				let vertices = rb.shape.vertices
				let intersections = []
				let minimum = Infinity
				
				let check = true
				if (rb.checkInside(pos)) {
					check = false
					intersections = [pos]
					minimum = rb.convertToWorld().subtract(pos).magnitude()
				}
				
				if (check) {
					// Loop through all edges and find closest point per edge
					for (let j = 0; j < vertices.length; j++) {
						// Get edge endpoints
						let v0 = rb.convertToWorld(vertices[j])
						let v1 = j + 1 < vertices.length ? rb.convertToWorld(vertices[j + 1]) : rb.convertToWorld(vertices[0])
						
						// Get edge
						let edge = v1.subtract(v0)
						let fromV = pos.subtract(v0)
						let frac = fromV.dot(edge) / edge.dot(edge)
						frac = Math.max(0, Math.min(frac, 1))
						let intersection = edge.multiply(frac).add(v0)
						
						// Check point distance
						let dist = intersection.subtract(pos).magnitude()
						if (dist < radius) {
							// Add point if it belongs to the minimums
							if (dist < minimum - 0.001) {
								minimum = dist
								intersections = [intersection]
							}
							else if (dist < minimum + 0.001) {
								intersections.push(intersection)
							}
						}
					}
				}
				
				// Loop through all points and add forces equally
				let div = intersections.length
				if (div > 0) {
					for (let j = 0; j < div; j++) {
						// Get vertex and distance vectors
						let vertex = intersections[j]
						let distVector = vertex.subtract(pos)
						
						// Add impulse vector
						let normal = distVector.normalize()
						let impulse = 1 - minimum / radius
						normal = normal.multiply(impulse * power / div)
						rb.addImpulse(normal, vertex)
					}
				}
			}
		}
	}
	
}

// Default renderer class (to be used with canvases)
class PhysRenderer {
	
	constructor({canvas=null, phys=null, substeps=5, scale=10, fillShapes=false, drawTriangles=false, lineColor='#ffffff', fillColor='#ffffff', lineWidth=2} = {}) {
		// Check if a canvas and engine has been selected
		if (!canvas) {
			throw new Error('Renderer must have a canvas!')
		}
		if (!phys) {
			throw new Error('Renderer must have an engine attached!')
		}
		
		// Get important canvas properties
		this.canvas = canvas
		this.ctx = canvas.getContext('2d')
		
		// Set other relevant properties
		this.substeps = substeps
		this.scale = scale
		this.fillShapes = fillShapes
		this.drawTriangles = drawTriangles
		this.fillColor = fillColor
		this.lineColor = lineColor
		this.lineWidth = lineWidth
		
		// User-modifiable functions
		this.preDraw = null
		this.preShape = null
		this.preConst = null
		
		// Start the cycle
		this.phys = phys
		this.lastTime = performance.now()
		requestAnimationFrame(this.render.bind(this))
	}
	
	render() {
		// Calculate change in time
		let newTime = performance.now()
		let dt = (newTime - this.lastTime) / 1000
		this.lastTime = newTime
		
		// Prevent massive physics jumps
		if (dt > 0.1) dt = 0.1
		
		// Trigger a physics step
		this.phys.multiStep(dt, this.substeps)
		
		// Set up canvas
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.save();
		this.ctx.translate(this.canvas.width/2, this.canvas.height);
		this.ctx.scale(this.scale, -this.scale);
		
		// Line settings
		this.ctx.fillStyle = this.fillColor;
		this.ctx.strokeStyle = this.lineColor;
		this.ctx.lineWidth = this.lineWidth / this.scale;
		
		// Call pre-draw function
		if (this.preDraw) this.preDraw()
		
		// Draw each rigidbody
		for (let i = 0; i < this.phys.rbs.length; i++) {
			let rb = this.phys.rbs[i]
		
			// Start pen
			this.ctx.beginPath()
			
			// Call pre-shape function
			if (this.preShape) this.preShape(rb)
		
			// Ball case
			if (rb.shape.type == 'Ball' || rb.ghost) {
				let rad = rb.ghost ? 1 / this.scale : rb.shape.radius
				// Draw circular arc
				this.ctx.arc(rb.pos.x, rb.pos.y, rad, 0, Math.PI * 2)
				
				// Draw line to view rotation
				if (!rb.ghost) {
					this.ctx.moveTo(rb.pos.x, rb.pos.y)
					let spoke = rb.pos.add(new Vector2(rad, 0).rotate(rb.theta))
					this.ctx.lineTo(spoke.x, spoke.y)
				}
			}
			
			// Polygon case
			else if (rb.shape.type == 'Polygon') {
				if (this.drawTriangles) {
					// Get triangle list
					let triangles = rb.shape.triangles
					
					// Draw each individual triangle
					for (let t = 0; t < triangles.length; t++) {
						// Get individual triangle
						let triangle = triangles[t]
						
						// Begin at starting vertex
						let start = rb.convertToWorld(triangle[0])
						this.ctx.moveTo(start.x, start.y)
						
						// Draw each subsequent vertex
						for (let j = 1; j < triangle.length; j++) {
							let vertex = rb.convertToWorld(triangle[j])
							this.ctx.lineTo(vertex.x, vertex.y)
						}
						
						// Close shape
						this.ctx.closePath()
					}
				}
				else {
					// Get vertices
					let vertices = rb.shape.vertices
					
					// Begin at starting vertex
					let start = rb.convertToWorld(vertices[0])
					this.ctx.moveTo(start.x, start.y)
					
					// Move to each vertex and draw a line
					for (let j = 1; j < vertices.length; j++) {
						let vertex = rb.convertToWorld(vertices[j])
						this.ctx.lineTo(vertex.x, vertex.y)
					}
					
					// Close shape
					this.ctx.closePath()
				}
			}
			
			// Fill shape if eligible
			if (this.fillShapes) this.ctx.fill()
			
			// Close path and move on
			this.ctx.stroke()
			this.ctx.fillStyle = this.fillColor
			this.ctx.strokeStyle = this.lineColor
		}
		
		// Draw constraints
		for (let i = 0; i < this.phys.consts.length; i++) {
			let c = this.phys.consts[i]
			
			// Start pen
			this.ctx.beginPath()
			
			// Call pre-constraint function
			if (this.preConst) this.preConst(c)
			
			// Spring case
			if (c.type == 'Spring') {
				// Define points
				let v0 = c.a.convertToWorld(c.pointA)
				let v1 = c.b.convertToWorld(c.pointB)
				
				// Calculate difference and distance for later calculations
				let dx = v1.x - v0.x
				let dy = v1.y - v0.y
				let distance = v1.subtract(v0).magnitude()
				
				// Define frequency and amplitude for the sine wave
				let freq = Math.PI * 2 * c.coils / distance
				let amp = c.width
				
				// Create unit vectors for drawing the curve
				let ux = dx / distance
				let uy = dy / distance
				let vx = -uy
				let vy = ux
				
				// Go to starting point
				this.ctx.moveTo(v0.x, v0.y)
				
				// Iterate through all following pixels and draw sine wave
				for (let j = 0; j < distance; j += 1 / this.scale) {
					// Current position on straight line distance
					let cX = v0.x + j * ux
					let cY = v0.y + j * uy
					
					// Create offset from straight line point
					let offset = Math.sin(j * freq) * amp
					
					// Draw line to offset points
					this.ctx.lineTo(cX + offset * vx, cY + offset * vy)
				}
				
				// Draw circular arc
				this.ctx.arc(v1.x, v1.y, 1 / this.scale, 0, Math.PI * 2)
			}
			
			// Close path and finalize line
			this.ctx.stroke()
			this.ctx.fillStyle = this.fillColor
			this.ctx.strokeStyle = this.lineColor
		}
		
		// Prepare for next frame
		this.ctx.restore()
		requestAnimationFrame(this.render.bind(this))
	}
	
}
