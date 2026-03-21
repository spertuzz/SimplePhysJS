const canvas = document.getElementById('main')
const ctx = canvas.getContext('2d')

repeat = 100
timescale = 8
drawTriangles = true

// Render frame
let lastTime = performance.now()
function render() {
    // Calculate change in time
    let newTime = performance.now()
    let dt = (newTime - lastTime) / 1000
    lastTime = newTime
    
    // Prevent massive physics jumps
    if (dt > 0.1) dt = 0.1
    
    // Trigger a physics step
    multiStep(dt, repeat)
    
    // Set up canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width/2, canvas.height);
    ctx.scale(1, -1);
    
    // Line settings
    ctx.strokeStyle = '#ffffff'; // Black
    ctx.lineWidth = 2;
    
    // Draw each rigidbody
    for (let i = 0; i < rbs.length; i++) {
        let rb = rbs[i]
    
        // Start pen
        ctx.beginPath()
    
        // Ball case
        if (rb.shape.type == 'Ball') {
            // Draw circular arc
            ctx.arc(rb.pos.x, rb.pos.y, rb.shape.radius, 0, Math.PI * 2)
            // Draw line to view rotation
            ctx.moveTo(rb.pos.x, rb.pos.y)
            let spoke = rb.pos.add(new Vector2(rb.shape.radius, 0).rotate(rb.theta))
            ctx.lineTo(spoke.x, spoke.y)
        }
        
        // Polygon case
        else if (rb.shape.type == 'Polygon') {
			if (drawTriangles) {
				let triangles = rb.shape.triangles
				// Draw each individual triangle
				for (let t = 0; t < triangles.length; t++) {
					let triangle = triangles[t]
					// Begin at starting vertex
					let start = rb.convertToWorld(triangle[0])
					ctx.moveTo(start.x, start.y)
					for (let j = 1; j < triangle.length; j++) {
						let vertex = rb.convertToWorld(triangle[j])
						ctx.lineTo(vertex.x, vertex.y)
					}
					ctx.lineTo(start.x, start.y)
				}
			}
			else {
				let vertices = rb.shape.vertices
				// Begin at starting vertex
				let start = rb.convertToWorld(vertices[0])
				ctx.moveTo(start.x, start.y)
				// Move to each vertex and draw a line
				for (let j = 1; j < vertices.length; j++) {
					let vertex = rb.convertToWorld(vertices[j])
					ctx.lineTo(vertex.x, vertex.y)
				}
				ctx.lineTo(start.x, start.y)
			}
        }
        
        // Close path and finalize shape
        ctx.closePath()
        ctx.stroke()
    }
    
    // Prepare for next frame
    ctx.restore()
    requestAnimationFrame(render)
}

// Start animation
requestAnimationFrame(render)
