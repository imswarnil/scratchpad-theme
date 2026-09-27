---
title: "cogroup without tears"
course: saql-from-scratch
module: "Doing real work"
lesson: 4
minutes: 21
description: "Joining two streams when the keys do not quite line up."
date: 2025-05-04
---

## cogroup without tears

Joining two streams when the keys do not quite line up.

```sql
q = load "Opportunity";
q = group q by 'StageName';
q = foreach q generate 'StageName' as 'Stage', count() as 'Count';
```
