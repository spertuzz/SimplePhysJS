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
### Simulation
- Collisions between all types of rigidbodies with ranging elasticity (restitution).
  - Collisions are detected using the SAT (Separating Axis Theorem)
- Some distance-based constraints like springs.
- 'Tweakable' variables to change interactions and performance, like ways to change the timescale and gravity vector.
- 'Headless' design: The actual engine is completely separate from anything else.
  - The project also features a `renderer` and `simulation` file to actually render and view different simulations.

## Quick Start

SimplePhysJS is a very easy engine to get started with. First, you'll need to have use the `phys.js` file, as it performs all of the calculations. Essentially, that is the actual engine. You can then use its classes and functions from another file (in the case of my demo, `simulation.js` and `canvas.js`) in order to set up your own simulation and render the results.

To create a rigidbody, you must use the `Rigidbody` class:
```javascript
// This creates a ball
new Rigidbody({
    mass: 10, // Mass
    pos: new Vector2(10, 10),  // Position
    theta: 0,  // Initial rotation about the centroid in radians
    shape: {  // Shape information
        type: 'Ball',  // Required for it to be a ball
        radius: 2
    },
    bounce: 0.5  // Coefficient of restitution
})

// This creates a polygon
new Rigidbody({
    mass: 10,  // Mass
    pos: new Vector2(0, 30),  // Position
    theta: 1,  // Initial rotation about the centroid in radians
    shape: {  // Shape information
        type: 'Polygon',  // Required for it to be a polygon
        vertices: [  // Vertices in CLOCKWISE order, relative to pos
            new Vector2(5, 5),  // Position of vertex 1
            new Vector2(5, -5),  // Position of vertex 2, etc...
            new Vector2(-5, -5),
            new Vector2(-5, 5)
        ]
    },
    bounce: 1  // Coefficient of restitution
})

// More optional parameters are available.
```

Using this will spawn the rigidbodies once the simulation starts. They can also be spawned mid-execution.

## Roadmap

This engine certainly isn't done. There's still a lot to work on and many optimizations to make. Here are the currently planned features and improvements:
- [ ] **Optimizations and numeric stability:** Always. Need. More. Speed.
    - [x] AABB Bounding box collision detection
    - [x] Velocity damping and clamping
    - [x] Object sleeping
    - [x] Improved triangulation
    - [ ] Improved integration methods (like Verlet)
- [x] **Collision callback API and other tracking:** Ways to track collisions and other movement variables to increase utility.
- [ ] **Distance-based constraints:** Springs, rods, that kind of stuff.
    - [x] Springs
    - [ ] Rods
    - [ ] Ropes
    - [ ] Hinges

## Theory

If you're as fascinated by math as I am, feel free to check out the theory that makes this project possible! All of the math and physics used to create this project is explained in detail in <a href="THEORY.md">THEORY.md</a>. Enjoy!
