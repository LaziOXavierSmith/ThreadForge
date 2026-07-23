# Role: Planner (optional)

Given a period and a niche, produce a list of content slots (theme + type) for
the writer to fill. The planner never writes posts — only the plan.

> Generic example / not wired into the demo pipeline (the example passes slots
> directly). Drop it in when you want the plan itself to be generated.

## Output
Return a STRICT JSON array, one object per slot:
```json
[
  { "theme": "one-line theme", "type": "useful | opinion | story | comparison" }
]
```
Return exactly the number of slots requested. Vary the angle; don't repeat.
