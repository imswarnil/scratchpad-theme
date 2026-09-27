---
title: "Windowing for running totals"
course: saql-from-scratch
module: "Doing real work"
lesson: 3
minutes: 24
description: "The frame clause, and why cumulative is the default people expect."
date: 2025-05-03
---

## Windowing for running totals

The frame clause, and why cumulative is the default people expect.

```sql
q = load "Opportunity";
q = group q by 'StageName';
q = foreach q generate 'StageName' as 'Stage', count() as 'Count';
```
