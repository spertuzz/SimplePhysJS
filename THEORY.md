# Want to know how this works?

No worries. To start off, the fundamental idea for this entire engine is vectors.

---

## Vectors

A vector is an object in mathematics that has both direction and magnitude (size and direction, in simpler terms). They are often denoted as $\vec{v} = (x, y)$ in 2 dimensions, as a vector in 2D can point to any spot on the Cartesian plane. Because of this, a 2D vector is usually also visualized as an arrow pointing from $(0, 0)$.

*From now on, I will refer to a 2D vector as just a 'vector'. Additionally, for the vector* $\vec{v}$*,* $v_{x}$ *and* $v_{y}$ *are its horizontal and vertical components.*

If you're looking at physics engines, though, I think you're already familiar with vectors. Clearly, things like positions, velocities, impulses, displacement, etc. can all be expressed with a vector. The useful part here is what you can do with them:

### Dot Products

<p align="center">Given vectors $\vec{a}$ and $\vec{b}$, their dot product is defined as $\vec{a} \cdot \vec{b} = a_{x}b_{x} + a_{y}b_{y}$.</p>

This is an incredibly useful tool when dealing with vectors. Particularly, because it is used to **project** vector $\vec{b}$ onto vector $\vec{a}$.

**Projecting** vector $\vec{b}$ onto a normalized vector $\vec{a}$ is simply determining how much of $\vec{b}$ points in the direction of $\vec{a}$ which, more formally, would be the magnitude of the component in $\vec{b}$ that points in the direction of $\vec{a}$. This is evident because an alternative definition for the dot product is $\vec{a} \cdot \vec{b} = \Vert\vec{a}\Vert \Vert\vec{b}\Vert \cos(\theta)$ where $\theta$ is the angle between the vectors, so if $\vec{a}$ is a unit vector, $\vec{a} \cdot \vec{b} = \Vert\vec{b}\Vert \cos(\theta)$. A simpler way to look at it is that the dot product gives the length of the shadow that $\vec{b}$ casts on the direction of $\vec{a}$ if $\vec{a}$ has a length of one (if the size of $\vec{a}$ is greater, the length will be multiplied by $\Vert\vec{a}\Vert$).

This has several applications: particularly, it allows you to determine how far a point is in a given direction if that direction can be expressed as a unit vector.

### Cross Products

<p align="center">Given vectors $\vec{a}$ and $\vec{b}$, their cross product is defined as $\vec{a} \times \vec{b} = a_{x}b_{y} - a_{y}b_{x}$.</p>

Notice that if we take the perpendicular vector of $\vec{a}$, being $\vec{p} = (-a_{y}, a_{x})$, then $\vec{p} \cdot \vec{b} = p_{x}b_{x} + p_{y}b_{y} = a_{x}b_{y} - a_{y}b_{x} = \vec{a} \times \vec{b}$. So the cross product is essentially equal to the dot product, but with the perpendicular vector of $\vec{a}$. Since the dot product details how 'far' vector $\vec{b}$ is in the direction of $\vec{a}$, this cross product would show how far $\vec{b}$ is to the left or right of the direction of $\vec{a}$. Specifically, since we used the counter-clockwise perpendicular vector (rotated $90°$), a positive cross product would be to the left of vector $\vec{a}$ and a negative cross product would be to the right.

This will be useful later to determine if the angle between two vectors in concave or convex (as this depends on which 'direction' one vector is in relation to the other).

**TLDR;** dot products tell us how parallel two vectors are (how much they are going in the same direction), and cross products tell us how perpendicular they are (how much one goes to the left or right of the other).

---

## Rigidbodies

Rigidbodies are the main characters of this physics engine. They are rigid physics bodies (as in, they cannot deform). To define these mathematically, we need to give them different properties.

- **Position:** We can use a vector to determine a rigidbody's position.
- **Velocity:** Velocity must also be a vector as the rigidbody can be moving at any speed in any direction.
- **Angle:** I defined the angle as `theta` as our rigidbodies should ideally be able to rotate. This is not a vector, as in 2D objects can just pivot about a center in one direction.
- **Angular Velocity:** Similarly to the angle, angular velocity does not need to be a vector.

To calculate an object's position, we must integrate its velocity. This is because $v = \frac{dx}{dt}$, since it is defined as the rate of change of displacement over time. This integration can be done in multiple ways:

- **Euler integration:** Simply multiply $v$ by $dt$. This is possible because physics 'steps' or frames will happen in discrete intervals on a computer, so $dt$ is an actual number. This sort of emulates the sum of rectangles often associated with integration. There is a *semi-implicit* version of Euler integration where you go 'up the ladder': first velocity is updated, then position is integrated using the final value on each step. This is meant to be more numerically stable.
- **Verlet integration:** A form of integration useful for position calculations where the new position every frame is calculated based on the last position and change in velocity. By not storing velocity directly and only updating using changes in velocity, this is meant to reduce accumulation of error and therefore be much more stable than Euler integration.
- **Backwards Euler:** A method that depends on previous values of velocity and position, and solves for the new ones using a system of linear equations. It is very stable but also computationally expensive.

At this moment, SimplePhysJS uses **Euler integration**. It is not the best, but it is simple and quick to implement. A later goal is to upgrade to Verlet.

### Impulses

It would be very unstable to build a physics engine that runs entirely on continuous forces like real life. This is because real life 'runs' on continuous time while computer simulations run in discrete steps, and if we were to integrate forces in order to create movement, this would quickly accumulate numeric error and create a very unreliable result. Because of this, the SimplePhysJS (and many other physics engines) runs entirely on **impulses**.

An **impulse**, in physics, if defined as a change in momentum (remember that momentum is the product of an object's mass and velocity). Thus, to apply a linear impulse of $J$, the change in velocity will be $\Delta v = \frac{\Delta p}{m} = \frac{J}{m}$, where $m$ is the object's mass and $\Delta p$ is the change in momentum. Doing this, we can create motion. This idea can also be applied if we want to simulate continuous forces, as is the case of gravity. Using the formula $J = Ft$ (or the definition of force which says that $F = \frac{\Delta p}{\Delta t} \implies \int F \ dt = J$), we can integrate force to express it as an impulse. So, using this, we can simulate any changes in an object's motion.
