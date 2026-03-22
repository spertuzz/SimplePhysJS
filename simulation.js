// Rigidbodies

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
	bounce: 1
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
	bounce: 1
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
	bounce: 1
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
	bounce: 1
})

// Moving objects

new Rigidbody({
	mass: 10,
	pos: new Vector2(0, 200),
	shape: {
		type: 'Ball',
		radius: 10
	},
	bounce: 1
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
	bounce: 1
})

new Rigidbody({
	mass: 20,
	pos: new Vector2(-100, 50),
	shape: {
		type: 'Ball',
		radius: 20
	},
	bounce: 1,
	vel: new Vector2(20, 20)
})

new Rigidbody({
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
	bounce: 1
})

let springA = new Rigidbody({
	mass: 10,
	pos: new Vector2(100, 300),
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
	vel: new Vector2(30, 30)
})


let springB = new Rigidbody({
	mass: 10,
	pos: new Vector2(140, 100),
	shape: {
		type: 'Ball',
		radius: 10
	},
	bounce: 1,
	vel: new Vector2(10, 10)
})

new Spring({
	a: springA,
	b: springB,
	rest: 30,
	k: 5
})

// Collision callback example: timer to turn objects red on collision
for (let i = 0; i < rbs.length; i++) {
	let rb = rbs[i]
	rb.tags.red = 0
	rb.onCollide = (other, pack) => {
		rb.tags.red = 5
	}
}
