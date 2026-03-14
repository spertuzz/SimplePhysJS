// Rigidbodies

// Immovable walls

new Rigidbody(0, new Vector2(0, 10), 0, {
    type: 'Polygon',
    vertices: [
        new Vector2(300, 10),
        new Vector2(300, -10),
        new Vector2(-300, -10),
        new Vector2(-300, 10)
    ]
}, 1)

new Rigidbody(0, new Vector2(0, 440), 0, {
    type: 'Polygon',
    vertices: [
        new Vector2(300, 10),
        new Vector2(300, -10),
        new Vector2(-300, -10),
        new Vector2(-300, 10)
    ]
}, 1)

new Rigidbody(0, new Vector2(-290, 225), 0, {
    type: 'Polygon',
    vertices: [
        new Vector2(10, 205),
        new Vector2(10, -205),
        new Vector2(-10, -205),
        new Vector2(-10, 205)
    ]
}, 1)

new Rigidbody(0, new Vector2(290, 225), 0, {
    type: 'Polygon',
    vertices: [
        new Vector2(10, 205),
        new Vector2(10, -205),
        new Vector2(-10, -205),
        new Vector2(-10, 205)
    ]
}, 1)

// Moving objects

new Rigidbody(10, new Vector2(0, 200), 0, {
    type: 'Ball',
    radius: 10
}, 1)

new Rigidbody(10, new Vector2(100, 200), 0, {
    type: 'Polygon',
    vertices: [
        new Vector2(20, 20),
        new Vector2(20, -20),
        new Vector2(-20, -20),
        new Vector2(-20, 20)
    ]
}, 1, /*vel=new Vector2(100, 200)*/)

new Rigidbody(10, new Vector2(100, 300), 0, {
    type: 'Polygon',
    vertices: [
        new Vector2(0, 20),
        new Vector2(20, -40),
        new Vector2(0, -20),
        new Vector2(-20, -40)
    ]
}, 1, /*vel=new Vector2(100, 200)*/)


new Rigidbody(10, new Vector2(140, 100), 0, {
    type: 'Ball',
    radius: 10
}, 1, vel=new Vector2(10, 10))

new Rigidbody(20, new Vector2(-100, 50), 0, {
    type: 'Ball',
    radius: 20
}, 1, vel=new Vector2(20, 20))

new Rigidbody(10, new Vector2(-120, 150), 20, {
    type: 'Polygon',
    vertices: [
        new Vector2(20, 20),
        new Vector2(20, -20),
        new Vector2(-20, -20),
    ]
}, 1)
