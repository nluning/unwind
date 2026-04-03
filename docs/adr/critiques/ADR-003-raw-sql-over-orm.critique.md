Perfect! Now I have enough information to conduct the critique. Let me review the evidence I've gathered:

**Code observations:**
1. The project uses `pg` package with parameterized queries consistently
2. Connection pooling is properly implemented with `new pg.Pool()`
3. All user input is passed as parameters (e.g., `$1`, `$2`) in SQL queries
4. The migrate.ts executes migration files without parameterization (direct SQL from files)
5. The seed.ts properly uses parameterization for dynamic data
6. Routes show N+1 patterns: loops with individual INSERT/UPDATE queries (lines in routes.ts)
7. The ADR doesn't mention schema versioning/migrations
8. Tests confirm parameterization is being used throughout

Now let me produce the critique:

## ADR Critique: Raw SQL over ORM/query builder

### Verdict: ADEQUATE

### Summary
ADR-003 makes a clear, defensible decision to use raw SQL with the `pg` package instead of an ORM. The decision is grounded in real context (~100 users) and acknowledges key tradeoffs. Implementation is sound and consistent—all queries use parameterized statements, preventing SQL injection. However, the ADR understates a significant consequence of raw SQL: the friction of manual batching and loop-based inserts, which the codebase already exhibits. The ADR also remains silent on the migration strategy, schema versioning, and query optimization patterns that will matter as the application grows.

### Strengths

- **Correct security model**: Every instance of user input is properly parameterized. Routes use `$1`, `$2`, etc., with values passed as array arguments. No string concatenation or template literal SQL. `backend/src/routes.ts` and `backend/src/routes/auth.ts` consistently follow this pattern.
- **Honest about the core rationale**: The context (~100 users, developer understanding > ORM convenience) is real and reasonable. At this scale, understanding actual queries matters more than migration scaffolding.
- **Pragmatic on connection management**: The code uses `pg.Pool` correctly with proper connection lifecycle (acquire, use, release). `backend/src/db/index.ts` sets this up as a Fastify plugin.
- **Schema versioning in place**: The migration system (`backend/src/db/migrate.ts`) tracks applied migrations and prevents re-running them—a critical piece that the ADR doesn't mention but the implementation has solved.
- **Parameterization applied consistently**: Even the seed file (`backend/src/db/seed.ts`) uses parameterized queries for dynamic data, showing the team understands the discipline required.

### Issues Found

1. **N+1 query pattern not discussed**
   - **Type:** Missing consequence
   - **Evidence:** `backend/src/routes.ts` lines ~145-149 (POST /activities):
     ```typescript
     for (const categoryId of category_ids) {
         await fastify.pg.query(
             'INSERT INTO activity_categories (activity_id, category_id) VALUES ($1, $2)',
             [activity.id, categoryId]
         )
     }
     ```
     Same pattern in PUT /activities/:id (lines ~215-221). Adding a single activity with 3 categories executes 4 queries (1 INSERT + 3 junction inserts) instead of 1. This is a direct consequence of raw SQL without a batch abstraction.
   - **Question for the author:** As activity categories grow or user-created activities become common, will you refactor these loops to use multi-row INSERT or VALUES clauses, or accept the performance hit? Does your monitoring catch this?

2. **Migration files execute raw SQL without parameterization**
   - **Type:** Drift / potential vulnerability
   - **Evidence:** `backend/src/db/migrate.ts` line 18:
     ```typescript
     await client.query(fileContent)
     ```
     Migration files (e.g., `backend/src/db/migrations/001_initial_schema.sql`) are read and executed directly. If a migration file is ever generated or edited to include user input, there's a risk.
   - **Question for the author:** Who has write access to the migrations directory? If CI/CD generates migrations, do you validate them before execution? Is this acceptable risk?

3. **Consequence of verbosity not fully explored: maintenance burden**
   - **Type:** Missing consequence
   - **Evidence:** Consider the updates in `backend/src/routes.ts` line ~205-210 (PUT /activities):
     ```sql
     UPDATE activities
     SET title = COALESCE($1, title),
         description = COALESCE($2, description),
         suggested_duration = COALESCE($3, suggested_duration),
         min_stress_level = COALESCE($4, min_stress_level),
         max_stress_level = COALESCE($5, max_stress_level)
     WHERE id = $6 AND user_id = $7
     ```
     This is repetitive boilerplate for partial updates. The ADR claims "every query is visible," but doesn't acknowledge that visibility comes with the burden of hand-maintaining these patterns. An ORM would generate this.
   - **Question for the author:** How do you prevent drift between the database schema and these hand-written queries? Do you have tests that ensure all columns are hydrated on the happy path?

4. **No mention of how queries are logged, monitored, or debugged**
   - **Type:** Missing consequence
   - **Evidence:** The ADR claims "Full control over what runs against the database — easier to reason about performance and debug issues." But there's no evidence in the code of query logging, slow query detection, or a query audit trail. `backend/src/auth.ts` has no logging around session queries; neither do the activity routes.
   - **Question for the author:** How will you detect an N+1 query problem in production? Do you have query observability? What is your SLA for query response time?

5. **Session validation JOIN not indexed (potential performance risk)**
   - **Type:** Potential drift from stated goal (full control + performance reasoning)
   - **Evidence:** `backend/src/auth.ts` line 50-57:
     ```typescript
     const result = await pg.query(
       `SELECT s.id, s.user_id, s.expires_at, u.email
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.id = $1`,
       [id]
     )
     ```
     This query runs on every authenticated request. Without an index on `sessions.id`, it's O(n). The migrations don't show any indices. At scale, this becomes a bottleneck.
   - **Question for the author:** Did you verify that `sessions(id)` is indexed? If not, when will you discover this problem?

6. **Raw SQL doesn't prevent logic errors; human discipline alone does**
   - **Type:** Weak justification / implicit assumption
   - **Evidence:** The ADR assumes developers will understand and write correct queries. But `backend/src/routes.ts` shows `app.pg.query(...)` called directly in route handlers with no query abstraction layer, no query builders, no type-safe query construction. A typo in a column name (e.g., `use_id` vs `user_id`) would fail only at runtime.
   - **Question for the author:** How many query bugs made it to production before you caught them in code review? Would a query builder have caught any of these?

7. **Concurrent updates to counters are not atomic**
   - **Type:** Missing consequence (data integrity)
   - **Evidence:** `backend/src/routes.ts` line ~255-260 (POST /usage-events):
     ```typescript
     // Insert the event
     await fastify.pg.query(...)
     // Update the counter on the activity
     await fastify.pg.query(
       `UPDATE activities SET ${column} = ${column} + 1 WHERE id = $1`,
       [activity_id]
     )
     ```
     Two separate queries. If two requests run concurrently, the counter increments may race. This is a raw SQL consequence that an ORM with transactions would handle more obviously.
   - **Question for the author:** Is this intentional? Should the counter updates be wrapped in a transaction or made atomic with RETURNING?

### Missing from this ADR

- **Schema migration strategy**: How will you version, test, and deploy schema changes in production? The implementation has solved this, but the ADR doesn't mention it as a consequence.
- **Query performance monitoring**: The ADR assumes "easier to reason about performance," but provides no strategy for detecting slow queries, N+1 problems, or index misses in production.
- **Scaling beyond 100 users**: At what user count does the lack of an ORM's migration/relationship tools become painful? When do you hire a DBA?
- **Transaction handling**: How will you enforce ACID properties when queries must be coordinated across multiple statements (as shown in the usage_events + counter update)?
- **Query optimization guidelines**: No mention of how the team should approach indexing, join optimization, or query profiling.
- **Fallback plan**: If raw SQL becomes a bottleneck or source of regressions, what is the migration path?

### Suggested questions for review

1. **Trace question**: Walk me through how a query optimization bug (e.g., missing index on sessions.id) would be discovered and fixed in your current production monitoring setup. What metrics would alert you?

2. **Why question**: Why are category links inserted in a loop instead of a single multi-row INSERT? What would make you refactor it, and when?

3. **What-if question**: If a developer accidentally writes `WHERE use_id = $1` instead of `WHERE user_id = $1`, how many code reviews pass before production? What's your testing strategy for these kinds of typos?

4. **Trace question**: Show the sequence of queries that run when a user upgrades from device auth to email auth (`POST /auth/upgrade`). Are there any race conditions or missing transaction boundaries?

5. **Why question**: Why is query logging and observability not mentioned in the ADR if "full control" and "easier to debug" are selling points? How do you operationalize these claims?