// Physics engine object
var phys = new SimplePhysJS({
	timescale: 2
})

// SPS update callback
phys.spsUpdate = function(sps) {
	console.log(sps)
}

// Immovable walls

new Rigidbody({
	mass: 0,
	pos: new Vector2(0, 1),
    shape: {
		type: 'Polygon',
		vertices: [
			new Vector2(30, 1),
			new Vector2(30, -1),
			new Vector2(-30, -1),
			new Vector2(-30, 1)
		]
	},
	parent: phys
})

new Rigidbody({
	mass: 0,
	pos: new Vector2(0, 44),
	shape: {
		type: 'Polygon',
		vertices: [
			new Vector2(30, 1),
			new Vector2(30, -1),
			new Vector2(-30, -1),
			new Vector2(-30, 1)
		]
	},
	parent: phys
})

new Rigidbody({
	mass: 0,
	pos: new Vector2(-29, 22.5),
	shape: {
		type: 'Polygon',
		vertices: [
			new Vector2(1, 20.5),
			new Vector2(1, -20.5),
			new Vector2(-1, -20.5),
			new Vector2(-1, 20.5)
		]
	},
	parent: phys
})

new Rigidbody({
	mass: 0,
	pos: new Vector2(29, 22.5),
	shape: {
		type: 'Polygon',
		vertices: [
			new Vector2(1, 20.5),
			new Vector2(1, -20.5),
			new Vector2(-1, -20.5),
			new Vector2(-1, 20.5)
		]
	},
	parent: phys
})

// Moving objects

new Rigidbody({
	mass: 1,
	pos: new Vector2(0, 20),
	shape: {
		type: 'Ball',
		radius: 1
	},
	parent: phys
})

new Rigidbody({
	mass: 1,
	pos: new Vector2(10, 20),
	shape: {
		type: 'Polygon',
		vertices: [
			new Vector2(2, 2),
			new Vector2(2, -2),
			new Vector2(-2, -2),
			new Vector2(-2, 2)
		]
	},
	parent: phys
})

new Rigidbody({
	mass: 2,
	pos: new Vector2(-10, 5),
	shape: {
		type: 'Ball',
		radius: 2
	},
	vel: new Vector2(2, 2),
	parent: phys
})

new Rigidbody({
	mass: 0,
	pos: new Vector2(0, 10),
	shape: {
		type: 'Ball',
		radius: 1
	},
	parent: phys
})

let s1 = new Rigidbody({
	mass: 1,
	pos: new Vector2(-12, 15),
	theta: 1,
	shape: {
		type: 'Polygon',
		vertices: [
			new Vector2(2, 2),
			new Vector2(2, -2),
			new Vector2(-2, -2),
		]
	},
	parent: phys
})

let s0 = new Rigidbody({
	mass: 1,
	pos: new Vector2(10, 30),
	theta: 1,
	shape: {
		type: 'Polygon',
		vertices: [
			new Vector2(0, 2),
			new Vector2(2, -4),
			new Vector2(0, -2),
			new Vector2(-2, -4)
		]
	},
	vel: new Vector2(3, 3),
	parent: phys
})


let s2 = new Rigidbody({
	mass: 1,
	pos: new Vector2(14, 10),
	shape: {
		type: 'Ball',
		radius: 1
	},
	vel: new Vector2(1, 1),
	parent: phys
})

new Spring({
	a: s0,
	posB: new Vector2(0, 43),
	rest: 6,
	k: 1,
	parent: phys
})

new Spring({
	a: s1,
	b: s2,
	posA: new Vector2(2, 2),
	rest: 4,
	k: 1,
	parent: phys
})

// Collision callback example: timer to turn objects red on collision
for (let i = 0; i < phys.rbs.length; i++) {
	let rb = phys.rbs[i]
	rb.tags.red = 0
	rb.onCollide = function(other, pack) {
		rb.tags.red = 5
	}
}

// Renderer
var renderer = new PhysRenderer({
	phys: phys,
	canvas: document.getElementById('main'),
	drawTriangles: false,
	fillShapes: false
})

// Collision callback renderer function
renderer.preShape = function(rb) {
	if ('red' in rb.tags) {
		if (rb.tags.red > 0) {
			renderer.ctx.strokeStyle = '#ff0000'
			renderer.ctx.fillStyle = '#ff0000'
			rb.tags.red--
		}
	}
}
