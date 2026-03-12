// Rigidbodies

// Immovable floor
new Rigidbody(0, new Vector2(0, 10), 0, {
    type: 'Polygon',
    vertices: [
        new Vector2(200, 10),
        new Vector2(200, -10),
        new Vector2(-200, -10),
        new Vector2(-200, 10)
    ]
}, 1)

// Bouncy ball
new Rigidbody(10, new Vector2(0, 200), 0, {
    type: 'Ball',
    radius: 10
}, 1)
