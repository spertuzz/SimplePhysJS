# SimplePhysJS

Welcome! SimplePhysJS is meant to be a simple, lightweight rigidbody physics engine for web applications (built specifically on JS). I decided to do this mainly because I was bored and realized that I've been taking physics engines for granted my entire life (e.g., every game engine has them), so I decided to build one myself! I heavily recommend undertaking a project like this as it has been a massive learning experience for me. Watching the simulations is nice, too!

<div align="center">
  <img src="../assets/showcase0.gif" alt="SimplePhysJS Showcase" width="400">
</div>

## Features
### Classes
- **`Vector2` class:** A simple 2-dimensional vector with methods for arithmetic, dot and cross products, angle and magnitude, rotation, perpendiculars, and normalization.
- **`Rigidbody` class:** The star of the show. A 2-dimensional rigidbody class.
  - Supports application of linear impulses and forces, which can also apply torque if placed at an angle.
  - Properties such as `mass`, `vel` (velocity), `centroid`, `inertia`, and more.
  - Two types of rigidbodies: `Ball` and `Polygon`.
    - Triangulation by ear-clipping is used to support concave polygons as well as convex ones.
  - Massless rigidbodies are also supported, and these are used as static objects.
- **`Spring` class:** A distance-based spring constraint.
  - Applies forces (both linear and angular components).
  - Placed between two ends which can be rigidbodies or static points.
  - Modifiable resting length and spring constant.
- **`SimplePhysJS` class:** The actual engine.
  - Create engine instances which you can control at will.
  - Use functions like `step(dt)` and `multiStep(dt, count)` to advance the simulation.
  - Fun things like `addRadialImpulse(pos, radius, power)`.
  - Diagnostic callbacks like `spsUpdate`.
- **`PhysRenderer` class:** A default renderer for the engine.
  - Create render instances that tie to the engine.
  - Animate and visualize collision simulations.
  - Change properties like `lineColor`, `fillShapes`, `drawTriangles`, and more.
  - Modify intermediate functions like `preDraw`, `preShape`, and `preConst` to add properties and change rendering.
### Simulation
- Collisions between all types of rigidbodies with ranging elasticity (restitution) and friction.
  - Collisions are detected using the SAT (Separating Axis Theorem)
- Customizable callbacks for collisions (including pre-packaged collision info).
- Some distance-based constraints like springs.
- 'Tweakable' variables to change interactions and performance, like ways to change the timescale and gravity vector.
- 'Headless' design: The actual engine is completely separate from anything else, and comes with a built-in renderer.
  - The project also features a `simulation` file to actually render and view different simulations.

## Quick Start

SimplePhysJS is a very easy engine to get started with. First, you'll need to have use the `phys.js` file, as it performs all of the calculations. Essentially, that is the actual engine. You can then use its classes and functions from another file (in the case of my demo, `simulation.js`) in order to set up your own simulation and render the results.

To create a rigidbody, you must use the `Rigidbody` class:
```javascript
// This creates the actual engine instance
const phys = new SimplePhysJS({
    g: new Vector2(0, -5),  // Gravity vector
    timescale: 2  // Engine timescale
})

// This creates a ball
new Rigidbody({
    mass: 10, // Mass
    pos: new Vector2(10, 10),  // Position
    shape: {  // Shape information
        type: 'Ball',  // Required for it to be a ball
        radius: 2
    },
    bounce: 1,  // Coefficient of restitution
    parent: phys  // Parent engine
})

// This creates a polygon
new Rigidbody({
    mass: 10,  // Mass
    pos: new Vector2(0, 30),  // Position
    theta: 1,  // Initial rotation about the centroid in radians
    shape: {  // Shape information
        type: 'Polygon',  // Required for it to be a polygon
        vertices: [  // Vertices in CLOCKWISE order, relative to pos
            new Vector2(1, 1),  // Position of vertex 1
            new Vector2(1, -1),  // Position of vertex 2, etc...
            new Vector2(-1, -1),
            new Vector2(-1, 1)
        ]
    },
    bounce: 1,  // Coefficient of restitution
    parent: phys
})

// This creates a renderer (starts drawing automatically)
const renderer = new PhysRenderer({
    phys: phys,  // Parent engine
    canvas: myCanvas,  // Canvas to draw on
    drawTriangles: true  // Optional parameter to draw the triangles of triangulated polygons
})

// More optional parameters are available and callbacks.
```

Using this will spawn the rigidbodies once the simulation starts. They can also be spawned mid-execution.

## Roadmap

This engine certainly isn't done. There's still a lot to work on and many optimizations to make. Here are the currently planned features and improvements:
- [ ] **Optimizations and numeric stability:** Always. Need. More. Speed.
    - [x] AABB Bounding box collision detection
    - [x] Velocity damping and clamping
    - [x] Object sleeping
    - [x] Improved triangulation
    - [x] Spatial hashing collision filter
    - [ ] Improved integration methods (like Verlet)
- [x] **Callbacks and other forms of tracking:** Ways to track collisions and other movement variables to increase utility.
    - [x] Collision callbacks
    - [x] Simulation diagnostics (steps per second, etc.)
- [ ] **More physics features:** Things like friction and missing interactions.
    - [x] Explosions (radial impulses)
    - [x] Object friction
    - [ ] Air resistance
- [ ] **Distance-based constraints:** Springs, rods, that kind of stuff.
    - [x] Springs
    - [ ] Rods
    - [ ] Ropes
    - [ ] Hinges

## Theory

If you're as fascinated by math as I am, feel free to check out the theory that makes this project possible! All of the math and physics used to create this project is explained in detail in <a href="THEORY.md">THEORY.md</a>. Enjoy!
