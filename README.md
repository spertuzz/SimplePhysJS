# SimplePhysJS

Welcome! SimplePhysJS is meant to be a simple, lightweight rigidbody physics engine for web applications (built specifically on JS). I decided to do this mainly because I was bored and realized that I've been taking physics engines for granted my entire life (e.g., every game engine has them), so I decided to build one myself! I heavily recommend undertaking a project like this as it has been a massive learning experience for me. Watching the simulations is nice, too!

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
