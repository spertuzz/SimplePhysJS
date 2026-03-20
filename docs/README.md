# SimplePhysJS

Welcome! SimplePhysJS is meant to be a simple, lightweight rigidbody physics engine for web applications (built specifically on JS). I decided to do this mainly because I was bored and realized that I've been taking physics engines for granted my entire life (e.g., every game engine has them), so I decided to build one myself! I heavily recommend undertaking a project like this as it has been a massive learning experience for me. Watching the simulations is nice, too!

<div align="center">
  <img src="assets/showcase0.gif" alt="SimplePhysJS Showcase" width="400">
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
### Simulation
- Collisions between all types of rigidbodies with ranging elasticity (restitution).
  - Collisions are detected using the SAT (Separating Axis Theorem)
- 'Tweakable' variables to change interactions and performance, like ways to change the timescale, gravity vector, and the amount of physics steps performed on each frame.
- 'Headless' design: The actual engine is completely separate from anything else.
  - The project also features a `renderer` and `simulation` file to actually render and view different simulations.

## Quick Start

SimplePhysJS is a very easy engine to get started with. First, you'll need to have use the `phys.js` file, as it performs all of the calculations. Essentially, that is the actual engine. You can then use its classes and functions from another file (in the case of my demo, `simulation.js` and `canvas.js`) in order to set up your own simulation and render the results.

To create a rigidbody, you must use the `Rigidbody` class:
```javascript
// This creates a ball
new Rigidbody(
    10, // Mass
    new Vector2(10, 10),  // Position
    0,  // Initial rotation about the centroid in radians
    {  // Shape information
        type: 'Ball',  // Required for it to be a ball
        radius: 2
    },
    0.5  // Coefficient of restitution
    // Optional initial velocity vector (Vector2)
    // Optional initial angular velocity (number)
)

// This creates a polygon
new Rigidbody(
    10,  // Mass
    new Vector2(0, 30),  // Position
    1,  // Initial rotation about the centroid in radians
    {  // Shape information
        type: 'Polygon',  // Required for it to be a polygon
        vertices: [  // Vertices in CLOCKWISE order, relative to pos
            new Vector2(5, 5),  // Position of vertex 1
            new Vector2(5, -5),  // Position of vertex 2, etc...
            new Vector2(-5, -5),
            new Vector2(-5, 5)
        ]
    },
    1  // Coefficient of restitution
    // Optional initial velocity vector (Vector2)
    // Optional initial angular velocity (number)
)
```

Using this will spawn the rigidbodies once the simulation starts. They can also be spawned mid-execution.

## Roadmap

This engine certainly isn't done. There's still a lot to work on and many optimizations to make. Here are the currently planned features and improvements:
- [ ] **AABB Bounding box collision detection:** A simple method to rule out impossible collisions in order to save computing power. Once implemented, it should drastically improve performance.
- [ ] **Collision callback API and other tracking:** Ways to track collisions and other movement variables to increase utility.
- [ ] **Distance-based constraints:** Springs, rods, that kind of stuff.
- [ ] **General optimizations and numeric stability:** Always. Need. More. Speed.

## Theory

If you're as fascinated by math as I am, feel free to check out the theory that makes this project possible! I still haven't created it, but soon a `THEORY.md` or a document or something like that will be available with a detailed explanation of all the math used in this engine.
