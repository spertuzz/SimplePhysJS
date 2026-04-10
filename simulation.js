// Physics engine
var phys = new SimplePhysJS({ timescale: 8 })

// Immovable walls

new Rigidbody({
	mass: 0,
	pos: new Vector2(0, 10),
    shape: {
		type: 'Polygon',
		vertices: [
			new Vector2(300, 10),
			new Vector2(300, -10),
			new Vector2(-300, -10),
			new Vector2(-300, 10)
		]
	},
	bounce: 1,
	parent: phys
})

new Rigidbody({
	mass: 0,
	pos: new Vector2(0, 440),
	shape: {
		type: 'Polygon',
		vertices: [
			new Vector2(300, 10),
			new Vector2(300, -10),
			new Vector2(-300, -10),
			new Vector2(-300, 10)
		]
	},
	bounce: 1,
	parent: phys
})

new Rigidbody({
	mass: 0,
	pos: new Vector2(-290, 225),
	shape: {
		type: 'Polygon',
		vertices: [
			new Vector2(10, 205),
			new Vector2(10, -205),
			new Vector2(-10, -205),
			new Vector2(-10, 205)
		]
	},
	bounce: 1,
	parent: phys
})

new Rigidbody({
	mass: 0,
	pos: new Vector2(290, 225),
	shape: {
		type: 'Polygon',
		vertices: [
			new Vector2(10, 205),
			new Vector2(10, -205),
			new Vector2(-10, -205),
			new Vector2(-10, 205)
		]
	},
	bounce: 1,
	parent: phys
})

// Moving objects

new Rigidbody({
	mass: 10,
	pos: new Vector2(0, 200),
	shape: {
		type: 'Ball',
		radius: 10
	},
	bounce: 1,
	parent: phys
})

new Rigidbody({
	mass: 10,
	pos: new Vector2(100, 200),
	shape: {
		type: 'Polygon',
		vertices: [
			new Vector2(20, 20),
			new Vector2(20, -20),
			new Vector2(-20, -20),
			new Vector2(-20, 20)
		]
	},
	bounce: 1,
	parent: phys
})

new Rigidbody({
	mass: 20,
	pos: new Vector2(-100, 50),
	shape: {
		type: 'Ball',
		radius: 20
	},
	bounce: 1,
	vel: new Vector2(20, 20),
	parent: phys
})

let s1 = new Rigidbody({
	mass: 10,
	pos: new Vector2(-120, 150),
	theta: 20,
	shape: {
		type: 'Polygon',
		vertices: [
			new Vector2(20, 20),
			new Vector2(20, -20),
			new Vector2(-20, -20),
		]
	},
	bounce: 1,
	parent: phys
})

let s0 = new Rigidbody({
	mass: 10,
	pos: new Vector2(100, 300),
	theta: 1,
	shape: {
		type: 'Polygon',
		vertices: [
			new Vector2(0, 20),
			new Vector2(20, -40),
			new Vector2(0, -20),
			new Vector2(-20, -40)
		]
	},
	bounce: 1,
	vel: new Vector2(30, 30),
	parent: phys
})


let s2 = new Rigidbody({
	mass: 10,
	pos: new Vector2(140, 100),
	shape: {
		type: 'Ball',
		radius: 10
	},
	bounce: 1,
	vel: new Vector2(10, 10),
	parent: phys
})

new Spring({
	a: s0,
	posB: new Vector2(0, 430),
	rest: 60,
	k: 5,
	parent: phys
})

new Spring({
	a: s1,
	b: s2,
	posA: new Vector2(20, 20),
	rest: 40,
	k: 5,
	parent: phys
})

// Collision callback example: timer to turn objects red on collision
for (let i = 0; i < phys.rbs.length; i++) {
	let rb = phys.rbs[i]
	rb.tags.red = 0
	rb.onCollide = (other, pack) => {
		rb.tags.red = 5
	}
}
