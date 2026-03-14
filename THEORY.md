# Want to know how this works?

No worries. To start off, the fundamental idea for this entire engine is vectors.

## Vectors

A vector is an object in mathematics that has both direction and magnitude (size and direction, in simpler terms). They are often denoted as $\mathbf{v} = (x, y)$ in 2 dimensions, as a vector in 2D can point to any spot on the Cartesian plane. Because of this, a 2D vector is usually also visualized as an arrow pointing from $(0, 0)$.

*From now on, I will refer to a 2D vector as just a 'vector'. Additionally, for the vector* $\mathbf{v}$*,* $v_{x}$ *and* $v_{y}$ *are its horizontal and vertical components.*

If you're looking at physics engines, though, I think you're already familiar with vectors. Clearly, things like positions, velocities, impulses, displacement, etc. can all be expressed with a vector. The useful part here is what you can do with them:

### Dot Products

<p align="center">Given vectors $\mathbf{a}$ and $\mathbf{b}$, their dot product is defined as $\mathbf{a} \cdot \mathbf{b} = a_{x}b_{x} + a_{y}b_{y}$.</p>

This is an incredibly useful tool when dealing with vectors. Particularly, because it is equivalent to **projecting** vector $\mathbf{b}$ onto vector $\mathbf{a}$.

**Projecting** vector $\mathbf{b}$ onto $\mathbf{a}$ is simply determining how much of $\mathbf{b}$ points in the direction of $\mathbf{a}$ which, more formally, would be the magnitude of the '$\mathbf{a}$' component in $\mathbf{b}$.
