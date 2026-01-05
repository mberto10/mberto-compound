# Evolutionary Algorithms and LRU Caching: Optimization Under Constraint

## The Core Insight

Both biological evolution and LRU (Least Recently Used) caching solve the same fundamental problem: **what to keep and what to discard when resources are finite**.

| Domain | Limited Resource | Optimization Target |
|--------|------------------|---------------------|
| Evolution | Energy, time, cognitive capacity | Reproductive fitness |
| LRU Cache | Memory slots | Cache hit rate |

Both systems converge on similar heuristics because they face structurally identical constraints.

---

## Recency as a Universal Heuristic

LRU operates on temporal locality: *what was accessed recently is likely to be accessed again soon*.

Evolution appears to have hardwired analogous heuristics into cognition:

- **Availability heuristic**: Recent events feel more probable
- **Recency bias in learning**: Recent experiences outweigh distant ones
- **Emotional decay**: Salience fades over time (like cache entries aging out)
- **Working memory limits**: Only ~7 items held active at once

These aren't bugs—they're features. They're cache policies optimized for ancestral survival, not objective truth.

---

## Memory as Evolved Cache Management

The brain cannot store everything with equal fidelity. Human forgetting may be an evolved eviction policy:

### Parallels to Cache Strategies

| Memory Phenomenon | Cache Equivalent |
|-------------------|------------------|
| Forgetting curve | TTL (time-to-live) expiration |
| Emotional tagging | Priority/pinned cache entries |
| Spaced repetition strengthening | Access count incrementing |
| Interference from new learning | Cache replacement pressure |
| Childhood amnesia | Cold start / empty cache |

### The Adaptive Value of Forgetting

Forgetting isn't failure—it's garbage collection. A memory system that retained everything equally would be:
- Computationally expensive to search
- Cluttered with outdated information
- Unable to generalize (overfitting to specifics)

LRU-like eviction creates a memory optimized for *action* in the present, not *accuracy* about the past.

---

## Fitness Landscapes and Cache Invalidation

Evolutionary algorithms navigate "fitness landscapes" and must balance:

- **Exploitation**: Using cached solutions that work → cache hits
- **Exploration**: Trying mutations/novelty → cache misses, potential updates

Both systems face the **stale data problem**: when does previously useful information become misleading?

### Environment of Evolutionary Adaptedness (EEA)

Robert Wright's central theme: our psychology was cached for ancestral environments. Modern mismatches occur when:

- The environment changes faster than evolution can update
- Cached heuristics (jealousy, status-seeking, sugar cravings) fire in contexts where they no longer optimize fitness

This is **cache invalidation at civilizational scale**.

---

## Algorithmic Connections

### Evolutionary Algorithms Often Use Caching

- **Fitness caching**: Don't re-evaluate unchanged individuals
- **Phenotype caching**: Store expensive computations
- **Archive-based methods**: Keep elite solutions (like pinned cache entries)

### Caching Strategies Can Be Evolved

Meta-level insight: evolutionary algorithms can discover novel caching policies. The optimal eviction strategy depends on access patterns—and evolution is a pattern-discovery engine.

---

## Implications for Cognitive Science

If memory is an evolved cache, we might predict:

1. **Domain-specific retention policies**: Social information (faces, reputation) should have different "TTLs" than spatial information
2. **Emotional override**: High-stakes events bypass normal eviction (trauma as forced cache pinning)
3. **Sleep as cache consolidation**: Moving important items from working memory to long-term storage
4. **Nostalgia as cache warming**: Periodically re-accessing old entries to prevent eviction

---

## Questions to Explore

- What's the "cache hit rate" of human intuition in modern environments vs. ancestral ones?
- Are cognitive biases best understood as cache policies optimized for a different access pattern?
- Can we deliberately design better mental "eviction policies" through practices like journaling, meditation, or spaced repetition?
- How do cultural technologies (writing, search engines) function as external cache extensions?

---

## Source Context

Noted while reading *The Moral Animal* by Robert Wright—a book exploring how evolution shaped human psychology, emotions, and moral intuitions through the lens of Darwinian theory.

The connection emerged from thinking about Wright's discussion of evolved heuristics and the computational constraints that shaped them.
