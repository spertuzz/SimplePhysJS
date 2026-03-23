# Want to know how this works?

No worries. To start off, the fundamental idea for this entire engine is vectors.

---

## Vectors

A vector is an object in mathematics that has both direction and magnitude (size and direction, in simpler terms). They are often denoted as $\vec{v} = (x, y)$ in 2 dimensions, as a vector in 2D can point to any spot on the Cartesian plane. Because of this, a 2D vector is usually also visualized as an arrow pointing from $(0, 0)$.

*From now on, I will refer to a 2D vector as just a "vector". Additionally, for the vector* $\vec{v}$*,* $v_{x}$ *and* $v_{y}$ *are its horizontal and vertical components. This is important because some properties that are true of 2D vectors are not valid for higher-dimensional vectors. Specifically, the scalar expression for the cross product is only true in 2D.*

If you're looking at physics engines, though, I think you're already familiar with vectors. Clearly, things like positions, velocities, impulses, displacement, etc. can all be expressed with a vector. The useful part here is what you can do with them:

### Dot Products

<p align="center">Given vectors $\vec{a}$ and $\vec{b}$, their dot product is defined as $\vec{a} \cdot \vec{b} = a_{x}b_{x} + a_{y}b_{y}$.</p>

This is an incredibly useful tool when dealing with vectors. Particularly, because it is used to **project** vector $\vec{b}$ onto vector $\vec{a}$.

**Projecting** vector $\vec{b}$ onto a normalized vector $\vec{a}$ is simply determining how much of $\vec{b}$ points in the direction of $\vec{a}$ which, more formally, would be the magnitude of the component in $\vec{b}$ that points in the direction of $\vec{a}$. This is evident because an alternative definition for the dot product is $\vec{a} \cdot \vec{b} = \Vert\vec{a}\Vert \Vert\vec{b}\Vert \cos(\theta)$ where $\theta$ is the angle between the vectors, so if $\vec{a}$ is a unit vector, $\vec{a} \cdot \vec{b} = \Vert\vec{b}\Vert \cos(\theta)$. A simpler way to look at it is that the dot product gives the length of the shadow that $\vec{b}$ casts on the direction of $\vec{a}$ if $\vec{a}$ has a length of one (if the size of $\vec{a}$ is greater, the length will be multiplied by $\Vert\vec{a}\Vert$).

This has several applications: particularly, it allows you to determine how far a point is in a given direction if that direction can be expressed as a unit vector.

### Cross Products

<p align="center">Given vectors $\vec{a}$ and $\vec{b}$, their cross product is defined as $\vec{a} \times \vec{b} = a_{x}b_{y} - a_{y}b_{x}$.</p>

Notice that if we take the perpendicular vector of $\vec{a}$, being $\vec{p} = (-a_{y}, a_{x})$, then $\vec{p} \cdot \vec{b} = p_{x}b_{x} + p_{y}b_{y} = a_{x}b_{y} - a_{y}b_{x} = \vec{a} \times \vec{b}$. So the cross product is essentially equal to the dot product, but with the perpendicular vector of $\vec{a}$. Since the dot product details how "far" vector $\vec{b}$ is in the direction of $\vec{a}$, this cross product would show how far $\vec{b}$ is to the left or right of the direction of $\vec{a}$. Specifically, since we used the counter-clockwise perpendicular vector (rotated $90°$), a positive cross product would be to the left of vector $\vec{a}$ and a negative cross product would be to the right.

This will be useful later to determine if the angle between two vectors in concave or convex (as this depends on which "direction" one vector is in relation to the other).

**TLDR;** dot products tell us how parallel two vectors are (how much they are going in the same direction), and cross products tell us how perpendicular they are (how much one goes to the left or right of the other).

---

## Rigidbodies

Rigidbodies are the main characters of this physics engine. They are rigid physics bodies (as in, they cannot deform). The properties we are going to want to simulate for a rigidbody are position, orientation (angle), velocity, and angular velocity, as these are the ones that describe its motion.

To calculate an object's position, we must integrate its velocity. This is because $\vec{v} = \frac{d\vec{x}}{dt}$, since it is defined as the rate of change of displacement over time. This integration can be done in multiple ways:

- **Euler integration:** Simply multiply $\vec{v}$ by $dt$. This is possible because physics "steps" or frames will happen in discrete intervals on a computer, so $dt$ is an actual number. This sort of emulates the sum of rectangles often associated with integration. There is a *semi-implicit* version of Euler integration where you go "up the ladder": first velocity is updated, then position is integrated using the final value on each step. This is meant to be more numerically stable.
- **Verlet integration:** A form of integration useful for position calculations where the new position every frame is calculated based on the last position and change in velocity. By not storing velocity directly and only updating using changes in velocity, this is meant to reduce accumulation of error and therefore be much more stable than Euler integration.
- **Backwards Euler:** A method that depends on previous values of velocity and position, and solves for the new ones using a system of linear equations. It is very stable but also computationally expensive.

At this moment, SimplePhysJS uses **semi-implicit Euler integration**. It is not the best, but it is simple and quick to implement. A later goal is to upgrade to Verlet.

### Impulses

It would be very unstable to build a physics engine that runs entirely on continuous forces like real life. This is because real life "runs" on continuous time while computer simulations run in discrete steps, and if we were to integrate forces in order to create movement, this would quickly accumulate numeric error and create a very unreliable result. Because of this, the SimplePhysJS (and many other physics engines) runs entirely on **impulses**.

An **impulse**, in physics, is defined as a change in momentum (remember that momentum is the product of an object's mass and velocity). Thus, to apply a linear impulse of $\vec{J}$, the change in velocity will be $\Delta \vec{v} = \frac{\Delta \vec{p}}{m} = \frac{\vec{J}}{m}$, where $m$ is the object's mass and $\Delta \vec{p}$ is the change in momentum. Doing this, we can create motion. This idea can also be applied if we want to simulate continuous forces, as is the case of gravity. Using the formula $\vec{J} = \vec{F}t$ (or the definition of force which says that $\vec{F} = \frac{\Delta \vec{p}}{\Delta t} \implies \int \vec{F} \ dt = \vec{J}$), we can integrate force to express it as an impulse. So, using this, we can simulate any changes in an object's motion.

### Rotation

Rotation is more difficult to implement than linear motion, but it is similar in a way to linear motion. The equivalent for a force when referring to rotation is torque, which is essentially the capacity a force has to cause an object to rotate (also called its "moment"). Torque is defined as $\vec{\tau} = \vec{r} \times \vec{F}$, where $\vec{r}$ is the "lever arm" or the distance between the point where the force was applied and the pivot point over which the object will rotate. Now, just like how there is linear momentum which is the product of mass and linear velocity, there is "angular momentum" which is the product of an object's moment of inertia $I$ and its angular velocity $\omega$.

However, before we do this, we must find the actual pivot over which the object will rotate: its **centroid**! An object's **centroid** is defined as the geometric center of an object with uniform density, which would also be its center of mass. A circle's centroid is just its center, but for a polygon it's a different story. Here, it can be calculated as the weighted average of the centroid of each triangle that composes the polygon, where each one is weighted based on how much mass (or area) it has relative to the whole. The centroid of a triangle is easy to find, it's just its gravicenter (the spot where the medians meet), or the average of its three vertices in a coordinate plane.

Now with the centroid, we can think about the object's moment of inertia. This is essentially a measure of how difficult it is to make an object spin about a pivot, just like how mass can be treated as a measure of how difficult it is for a force to make an object move. Mathematically, it can be calculated as $I = \int \vec{r}^2 \ dm$, which is the sum of squared distances from the pivot over the mass of a continuous object. For a thin, circular disk (like the `Ball` rigidbodies in my engine), this formula simplifies to $I = \frac{mr^2}{2}$ where $r$ is the radius of the disk and $m$ is its mass. However, for polygons, this becomes much more complicated. If you have a "compound object", its moment of inertia can be expressed as the sum of the moments of inertia of its individual parts. This is logical as each individual "piece" of the object requires its own amount of torque to be rotated and, since mass is additive, it makes sense that the sum of those moments is required to rotate the whole thing. Thus, if we *triangulate* our polygons (we'll see more about this later), we can simply add up the moments for each triangle. If we define our polygon's vertices relative to the centroid (thus, treating it as the origin), the moment of inertia for each triangle is $I = \frac{m}{12}({\Vert \vec{v}_1 \Vert}^2 + {\Vert \vec{v}_2 \Vert}^2 + {\Vert \vec{v}_3 \Vert}^2 + {\Vert \vec{v}_1 + \vec{v}_2 + \vec{v}_3 \Vert}^2)$, where $m$ is the triangle's mass.

Once we have our moment of inertia calculated, we can finally determine the change in angular velocity caused by an impulse. If $I\Delta\omega = \vec{\tau}\Delta t $, then $I\Delta\omega = \vec{r} \times \vec{F}\Delta t = \vec{r} \times \vec{J}$, so finally $\Delta\omega = \frac{\vec{r} \times \vec{J}}{I}$ and that is how we find angular velocity.

---

## Collisions

Afterwards, it's time to talk about collisions! Right now, our rigidbodies can be moved and impulses can be added to them. However, if two happen to collide, they will just phase through each other. In this engine (and many others), collisions have 3 phases: detection, correction, and resolution.

### Filtering

Whoops! Did I say 3 phases? There's actually a secret "zero-th" phase: filtering! This one isn't actually needed: it just makes the engine run much, much faster. You'll see later that running a full collision check is very computationally expensive and requires looping through and checking many edges and shapes against each other using a particular theorem. However, if we manage to create a "simpler" way to check if two shapes *could* be colliding, then that could help us filter out impossible collisions so we only have to run the expensive check on a small amount of bodies rather than all possible pairs every step.

Imagine drawing a box (with sides parallel to the x and y axes) around an object such that it hugs the object as tightly as possible. This is called the object's **bounding box**, and it is very easy to find. Simply take the minimum and maximum values of both x and y across all the shape's points, and those define the "bounds" of the box. It is obvious that, for two objects to be colliding, both of their bounding boxes have to be overlapping as well, since they contain both objects. This is useful since checking if two bounding boxes are colliding is many times simpler than checking if two arbitrary polygons are colliding. Think about it this way: for two bounding boxes to collide, the rightmost border of the first one has to be further right than the leftmost border of the second one, since otherwise there would be a gap between them. This is true the other way around (the rightmost border of the second one must be further right than the leftmost border of the first one) so both $xMax_a > xMin_b$ and $xMax_b > xMin_a$ must be true. The same argument can be made for the vertical axis so $yMax_a > yMin_b$ and $yMax_b > yMin_a$ must both be true as well. So, if all four of these conditions are true, the bounding boxes are colliding since there is no gap between them on both axes.

So, using this, instead of running the expensive detection algorithm we'll see shortly for each pair of objects on every physics step, we can instead run this simple check. If the check says that a collision is possible, we can then run the expensive one. Essentially, this filters out all of the obviously impossible collisions and saves a ton of processing power.

### Detection

Collision detection is the first phase: before we talk about applying impulses to objects, we need to know if they're actually colliding. Rigidbodies in this engine, when colliding, will overlap slightly after their positions are updated. Our detection algorithm will determine if two rigidbodies are overlapping so we can make this change. This is heavily dependent on the colliding shapes' geometries, so we must treat each case separately.

However, in this phase, we don't just want to detect if they're colliding: we also want to determine which direction in which direction they should be pushed by the collision, the point of contact in order to later apply impulses, and how far they overlapped to correct that mistake. The point of contact and overlap make sense, but how do we find the direction? Well, it's something called the **normal vector**. The normal vector is the direction perpendicular to the tangent between colliding objects, otherwise known as the direction in which they will be launched. Thus, it is the perpendicular to the surface of contact. Now that we know this, we can observe what can be done in each case:

**Ball-on-ball collisions** are simple to deal with. Given two circles, the closest their centers can be to each other before the shapes overlap is when their distance is equal to the sum of their radii, since they would be tangent in this case. So, in order to check for a collision, we can simply look at whether or not the distance between the centers is less than this sum. If it is less, then a collision has occured. The point of contact will simply be the midpoint of the overlap distance and, the depth will be the size of the overlap, and the direction will be the line between both of the circle's centers, as that line is perpendicular to the tangent between them (if they were to be pushed just enough so that they no longer overlapped).

Before we continue, you may have realized that detecting collisions involving polygons may be difficult. Thankfully, we have a useful tool for this! It's called the **SAT** (not the test), or the **Separating Axis Theorem**. It's kind of simple: suppose you have two convex polygons. Now, consider an edge on either polygon and take its normalized perpendicular vector, which we will call an axis. Next, project each of the vertices from both polygons onto the axis using dot products. This will create two shadows: one for each polygon. After doing this for each possible axis, if any of the shadows don't overlap, then the shapes are not colliding. If all of them have overlap, then they are colliding. This theorem is also particularly convenient because, if they are colliding, then we automatically find the overlap depth and normal vector. The normal vector will simply be the axis with the smallest overlap (as they would have "just" collided or barely touched), and the overlap depth will be the amount of overlap between the shadows.

**Ball-on-polygon collisions** are now simple using the SAT. Notice that the projection of a circle (if we treat it as an infinite-sided shape) would simply be its diameter parallel to the axis. Now, what axes would be consider for the circle? Note that this really doesn't matter most of the time: if the circle collides on an edge of the polygon, the collision will be detected on that edge's perpendicular axis. The only edge case would be if a collision occuredon a vertex. Because of this, we must consider one extra axis: one from the center of the circle to the closest vertex on the polygon.

**Polygon-on-polygon collisions** are even easier now! In fact, they're a direct application of the SAT. The only part missing is the contact point. Take the chosen normal vector and determine the vertex closest to the other polygon along that vector and that will be the contact point. However, if the collision occurs along an edge, then two points will fit this criteria. We can save both of them and determine how to handle that collision case later.

And that's it! Well, not quite. You may have noticed a small caveat here. The SAT works only for **convex** polygons, but I'd want the engine to handle both convex and concave polygons. We can get around this limitation by **triangulating** our polygons. Triangulation is the process of converting a polygon into a set of distinct, non-overlapping triangles. We can do this by following an algorithm known as **ear clipping**, where protruding triangles on the edges of polygons called ears are procedurally removed until the entire shape is split into triangles. This is possible because the **Two Ears Theorem** guarantees that every simple polygon has at least two ears. To find an ear in our polygon, we can iterate through every pair of consecutive edges and determine if the angle is convex using the cross product. Depending on the order of the vertices (clockwise or counter-clockwise), the cross product between both edges coming out of the middle vertex will tell us how far one of the edges is perpendicular to the other, so we can determine the edge's direction. In the case of clockwise points, a negative cross product signals an inwards angle, which would be convex. Knowing that an angle is convex, we can then check if any points lie inside the triangle formed by the pair of edges. We can do this by iterating through every other point and checking if the sum of the areas it forms with each pair of vertices from the triangle adds up to the total area of the triangle. This works because, if the point is outside, the area will be extended outwards and go over the total. If no interior vertex is found, that is an ear. That triangle can then be saved and the algorithm is run again on the remaining parts of the shape.

If our polygons are triangulated, we can implement the SAT in a different way. Instead of running it on the entire polygon, we can check every triangle in one shape against every triangle in the other. Now, notice that multiple of these SAT checks could return a valid axis, so we need to choose one. I chose to take the axis with the largest overlap, since you want to conside the primary triangle that touched the other shape first (which would be the one that overlapped the most since it did so first).

### Correction

Yay! We made it past the hardest part. Collision correction is like a nice break, it's pretty much just fixing what's wrong with the collision: the overlap. Using the normal vector and overlap depth from the previous step, we can move both objects along that axis by a certain amount to fix the overlap. However, we can't just move both objects by the same amount. It would be more logical for a heavier object to be corrected less than a lighter one because of how it is more difficult to move. To do this, we scale the movement distance by each object's inverse mass. So, essentially, our "base" movement amount would be $b = \frac{\textrm{max}(d - s, 0)}{1/m_A+1/m_B}$ if $d$ is the depth, $s$ is a "slop" amount (the minimum amount of error we will accept), and $m_A$ and $m_B$ are the masses of bodies $A$ and $B$. Then, we would move $A$ by $b\vec{x}\frac{1}{m_A}$ in one direction and $B$ by $b\vec{x}\frac{1}{m_B}$ in the other, where $\vec{x}$ is our normal vector. This effectively scales the movement of each body along the vector by their inverse mass, so the heavier one will move less than the lighter one. However, we may not want this movement to be completed instantly, as this causes instant "jumps" in position (separate from velocity and impulses) that can interfere with our calculations and cause odd jumps or drops in energy. To make the simulation more stable, we multiply the base movement by a fraction (like 0.2) to let the correction happen in smaller steps each frame.

### Resolution

Okay, we've done a lot. All we're missing is the fun part: launching the objects! To do this, we want to consider the extent to which the velocity changes based on the impulse we want to apply. Specifically, the relative velocity of the collision point. We can treat the impulse, $J$, as a scalar and solve for it, and we can deal with the direction later (it will just be the normal vector's direction). The velocity of the point is equal to its linear velocity plus its linear tangential velocity, so it's $\Delta\vec{v}_p = \Delta\vec{v} + \Delta\vec{v}\_{ang} = \frac{J \cdot \vec{n}}{m} + (\Delta\omega \times \vec{r})$. Remember that $\Delta\omega = \frac{\vec{r} \times J\vec{n}}{I}$, (we use $J\vec{n}$ because we want it as a vector here with the direction) so $\Delta \vec{v}_p = \frac{J \cdot \vec{n}}{m} + (\frac{\vec{r} \times J\vec{n}}{I} \times \vec{r})$. Now, this may seem horrendous, but we can simplify it. We only really care about the difference in velocity relative to the normal vector, so we can project this onto the normal vector using the dot product. So $\Delta \vec{v}_p \cdot \vec{n} = \frac{J \cdot \vec{n}}{m} \cdot \vec{n} + (\frac{\vec{r} \times J\vec{n}}{I} \times \vec{r}) \cdot \vec{n}$. 

Now, let's look at this term by term. Focusing on $\frac{J \cdot \vec{n}}{m} \cdot \vec{n}$, it is clear that $\vec{n} \cdot \vec{n} = 1$ because they are both equal normalized vectors so the shadow of one will be the same length as the other. Another reason is because $\vec{n} \cdot \vec{n} = \Vert\vec{n}\Vert^2 = 1$. So $\frac{J \cdot \vec{n}}{m} \cdot \vec{n} = \frac{J}{m}$. The other term, $(\frac{\vec{r} \times J\vec{n}}{I} \times \vec{r}) \cdot \vec{n}$, is a bit more complicated, but don't worry: a simple trick can help us here. With 2D vectors, $(\vec{A} \times \vec{B}) \cdot \vec{C} = (\vec{B} \times \vec{C}) \cdot \vec{A}$, which can be proven by simply doing some algebra with the expressions for dot and cross products. So, $(\frac{\vec{r} \times J\vec{n}}{I} \times \vec{r}) \cdot \vec{n} = (\vec{r} \times \vec{n}) \cdot (\frac{\vec{r} \times J\vec{n}}{I}) = (\vec{r} \times \vec{n}) \cdot (\vec{r} \times \vec{n}) \cdot \frac{J}{I} = J\frac{(\vec{r} \times \vec{n})^2}{I}$ (we can extract $J$ and $I$ from the cross and dot products because they are constants). Thus, $\Delta\vec{v}\_p \cdot \vec{n} = \frac{J}{m} + J\frac{(\vec{r} \times \vec{n})^2}{I} = J(\frac{1}{m} + \frac{(\vec{r} \times \vec{n})^2}{I})$. Now we can plug in velocities for bodies $a$ and $b$ to get the total relative velocity. So $\Delta\vec{v}\_pa \cdot \vec{n} = -J(\frac{1}{m_a} + \frac{(\vec{r_a} \times \vec{n})^2}{I_a})$ and $\Delta\vec{v}\_pb \cdot \vec{n} = J(\frac{1}{m_b} + \frac{(\vec{r_b} \times \vec{n})^2}{I_b})$ (plugging in $-J$ for $a$ as we want their directions to be opposite), and we get

$$\Delta\vec{v}_p \cdot \vec{n} = \Delta\vec{v}_pb \cdot \vec{n} - \Delta\vec{v}_pa \cdot \vec{n} = J(\frac{1}{m_b} + \frac{(\vec{r_b} \times \vec{n})^2}{I_b}) + J(\frac{1}{m_a} + \frac{(\vec{r_a} \times \vec{n})^2}{I_a}) = J(\frac{1}{m_a} + \frac{1}{m_b} + \frac{(\vec{r_a} \times \vec{n})^2}{I_a} + \frac{(\vec{r_b} \times \vec{n})^2}{I_b})$$

Now, $\Delta\vec{v}_p = \vec{v}\_{pf} - \vec{v}\_{pi}$ (final - initial). Newton's law of restitution states that $-e\vec{v}\_{pi} = \vec{v}\_{pf}$ after a collision, where $e$ is the collision's coeficient of restitution (a number from 0 to 1 showing how elastic a collision is, which can be calculated in multiple ways like taking the minumum between both objects or multiplying their individual restitutions), so $\Delta\vec{v}_p = -e\vec{v}\_{pi} - \vec{v}\_{pi} = -(1 + e)\vec{v}\_{pi}$. So,

$$\Delta\vec{v}_p \cdot \vec{n} = -(1 + e)\vec{v}\_{pi} \cdot \vec{n} = -(1 + e)(\vec{v}\_{pi} \cdot \vec{n}) = J(\frac{1}{m_a} + \frac{1}{m_b} + \frac{(\vec{r_a} \times \vec{n})^2}{I_a} + \frac{(\vec{r_b} \times \vec{n})^2}{I_b}) \implies J = \frac{-(1 + e)(\vec{v}\_{pi} \cdot \vec{n})}{\frac{1}{m_a} + \frac{1}{m_b} + \frac{(\vec{r_a} \times \vec{n})^2}{I_a} + \frac{(\vec{r_b} \times \vec{n})^2}{I_b}}$$

So, with this formula, we can calculate the magnitude of the impulse applied to both objects, and then we can apply one impulse to each body in opposite directions relative to the normal vector.

You might've noticed, though, that some previously mentioned collisions may have two contact points. In this case, we would simply do this once for each point and apply the impulses sequentially, calculating each following one in terms of the updated velocities.

---

## Constraints

Right now, objects can move well on their own. We're missing something big though: constraints that limit or modify their movement! Things like ropes, rods, springs, and hinges that attach to objects and change how they move in some way. Don't worry: these actually aren't too complicated. They're not super simple, but we can take advantage of everything we've already built to make the job a lot easier.

### Springs

Springs attract or repel objects based on how far they are extended or contracted from their resting length. They behave in a very simple way: according to Hooke's law:

$$F = -kx$$

Where $F$ is the force applied by the spring on the object, $k$ is the "spring constant" which dictates how strong the spring is, and $x$ is the amount the spring has been extended from its resting position (a negative length implies a contraction). That's it. Even the direction of the force is straightforward; it's just the vector between the two points the spring is attached to, applied forwards or backwards based on which point it is.

So, in reality, defining a spring is quite simple. Simply define the two points that the spring is attached to, and apply the resulting forces on each point every physics step using our already existing integration and impulse-applying methods. That's really it, no joke. It's that easy!

---

## Stability

Well, that's *technically* it, but we're not actually done. This would all work perfectly if we lived in a perfect world, but we clearly don't! Specifically, computers make mistakes all the time and aren't particularly known for making precise calculations. For example, a calculation like $5 \div 2$ could result in $2.499999999$ instead of the correct answer, $2.5$, simply due to tiny errors. These errors constantly build up in our physics engine, causing massive problems in the long term. Resting objects could begin to shake due to imprecise velocity calculations, perfectly elastic objects could slowly lose energy, and many more things could happen. This is why it is important to implement solutions to improve numeric stability, which is, fittingly, how stable our calculations are. Here are some of my current fixes:

### In-Between Steps

It's clear that large time steps between physics calculations can result in big precision errors, particularly because it can allow objects to sink great distances into each other before colliding. A great way to fix this is simply to detach the frame rate of the simulation from its "step-rate". Instead of running one step per frame, we can run tens if not hundreds of steps in one frame, rendering only the final one. This leads to considerably smaller time steps and thus increased stability and smoothness without sacrificing animation quality.

### Clamping and Damping

Even if our formulas are perfect, we cannot guarantee a collision that is supposed to result in no angular velocity won't actually produce a velocity of $0.0000004$ or something like that. Small errors will always leave artifacts that will build up over time. But, these artifacts are miniscule. Like, what's really the difference between a velocity of zero and a velocity of $0.00000001$? It might as well be zero. This is exactly what clamping does: if velocity is very, very low, to the point that it is negligible, we simply set it to zero. This heavily improves stability as tiny errors get squashed before they can even begin to build up.

Now, this only works if we set our threshold to be something very tiny. Probably something small relative to the time between physics steps (which is what I used). We mainly do this to prevent jittering in supposedly static or non-rotating objects, but what if the velocity is slightly above that threshold? A small enough amount that it isn't noticeable, but large enough that clamping the velocity would look strange. Our solution here is damping: if the velocity is below a different, slightly more lenient threshold, we multiply it by a number very close to one every physics step, something like $0.999$ (it should preferably be calculated relative to the length of the time step, which is what I did). This effectively does the same thing as clamping without the sudden stop being noticeable; instead it is a natural, gradual decrease that only occurs if the velocity is already low enough for that to be reasonable.

### Sleeping

If an object hasn't moved at all for a long time, will it move anytime soon? Newton's first law says no, so we may as well forget about that object until something interacts with it. This is what it means to put an object to **sleep**. Essentially, if both an object's linear and angular velocities remain at zero for 10 consecutive physics steps (or below the "clamping" threshold from before), that object is put in a sleeping state where no velocity or position calculations are made on it. It remains completely static and the engine wastes no resources on it until a moving object collides with it. This heavily improves performance and numerical stability as its saves on unnecessary calculations and prevents behaviors like jittering.

### Sequential Collision Resolution

Remember when I said that, if you have more than one contact point in a collision, the solution is to apply them sequentially? Well, this is harder than it seems. If we do this in a straightforward way, like just applying both impulses, one point might overshoot the velocity and it's all over. The velocity of both points should ultimately converge to their desired final velocities after the impulses, and there is a direct way to do this.

We already know from Newton's law of restitution that $-e\vec{v}\_{i} = \vec{v}\_{f}$. So, using our formula for impulse, we can calculate the required impulse to reach this desired final velocity and apply it to the first point. Now, this would probably cause the object to start spinning, which would send the other point in the wrong direction. So, we simply run this calculation again to add an impulse to the next point for it to reach *its* desired final velocity. This will, consequently, mess up the velocity for the first point, but to a lesser extent, so we can run the process again. Essentially, we can repeat this process a few times, which will allow both points to converge to their ideal velocities. Additionally, we can store the total impulse added to each point so we don't accidentally apply a negative impulse, since a collision cannot push an object into another. These values will converge relatively quickly (only about 10 iterations are required for an accurate result) and, paired with our other strategies, this should result in a very stable collision response.

### Better Triangulation

Our triangulation algorithm, as previously mentioned, simply picks the first ear it finds and clips it. However, this may result in strange triangulation patterns that make it difficult to find the correct collision normal. Specifically, if many thin triangles are stacked on top of each other, the collision detection algorithm may return a normal from the wrong one and launch the objects in the incorrect direction. To mitigate this issue, we can improve our triangulation algorithm to produce more natural and balanced splits.

The issue here is mainly the long, thin triangles. These tend to have a very large perimeter relative to their area, since they have long sides while their thin structure leaves them with little to no area. So, when finding ears to clip from a shape, we can keep track of each candidate ear and "score" it based on its perimeter and area. I gave each triangle a score of $\frac{A}{p^2}$, where $A$ is the triangle's area and $p$ is its perimeter, and I used the squared perimeter to heavily punish greater perimeters. Then, the ear with the largest score is picked and the process is repeated as normal. This, in my case, resulted in much more natural triangulations with wider triangles overall.

---

That's pretty much how that works. A mix of all this stuff, and running it all in order to get things moving. Making projects like this is, to me, a very eye-opening experience. I've made use of physics engines many times but treated them like a sort of black box. Making one and learning how they work has been a very satisfying experience. I hope you've come to appreciate the math just as much as I have.
