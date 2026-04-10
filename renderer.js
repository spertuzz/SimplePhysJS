const canvas = document.getElementById('main')
const ctx = canvas.getContext('2d')

repeat = 100
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
    phys.multiStep(dt, repeat)
    
    // Set up canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width/2, canvas.height);
    ctx.scale(1, -1);
    
    // Line settings
	let defColor = '#ffffff'
    ctx.strokeStyle = defColor; // Black
    ctx.lineWidth = 2;
    
    // Draw each rigidbody
    for (let i = 0; i < phys.rbs.length; i++) {
        let rb = phys.rbs[i]
    
        // Start pen
        ctx.beginPath()
		
		// Collision callback example: turn objects red when colliding
		if ('red' in rb.tags) {
			if (rb.tags.red > 0) {
				ctx.strokeStyle = '#ff0000'
				rb.tags.red--
			}
		}
    
        // Ball case
        if (rb.shape.type == 'Ball' || rb.ghost) {
			let rad = rb.ghost ? 1 : rb.shape.radius
            // Draw circular arc
            ctx.arc(rb.pos.x, rb.pos.y, rad, 0, Math.PI * 2)
            // Draw line to view rotation
			if (!rb.ghost) {
				ctx.moveTo(rb.pos.x, rb.pos.y)
				let spoke = rb.pos.add(new Vector2(rad, 0).rotate(rb.theta))
				ctx.lineTo(spoke.x, spoke.y)
			}
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
					ctx.closePath()
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
				ctx.closePath()
			}
        }
        
        // Close path and finalize shape
        ctx.stroke()
		ctx.strokeStyle = defColor;
    }
	
	for (let i = 0; i < phys.consts.length; i++) {
		let c = phys.consts[i]
		
		// Start pen
		ctx.beginPath()
		
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
			let freq = Math.PI * 2 * c.k / distance
			let amp = c.width
			
			// Create unit vectors for drawing the curve
			let ux = dx / distance
			let uy = dy / distance
			let vx = -uy
			let vy = ux
			
			ctx.moveTo(v0.x, v0.y)
			// Iterate through all following pixels and draw sine wave
			for (let j = 0; j <= distance; j++) {
				// Current position on straight line distance
				let cX = v0.x + j * ux
				let cY = v0.y + j * uy
				
				// Create offset from straight line point
				let offset = Math.sin(j * freq) * amp
				
				// Draw line to offset points
				ctx.lineTo(cX + offset * vx, cY + offset * vy)
			}
		}
		
		// Close path and finalize line
        ctx.stroke()
		ctx.strokeStyle = defColor;
	}
    
    // Prepare for next frame
    ctx.restore()
    requestAnimationFrame(render)
}

// Start animation
requestAnimationFrame(render)
