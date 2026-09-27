---
title: "Your first query"
course: saql-from-scratch
module: "Getting oriented"
lesson: 2
minutes: 18
description: "load, foreach, group — the three verbs that do most of the work."
date: 2025-05-02
---

## Your first query

load, foreach, group — the three verbs that do most of the work.

```sql
q = load "Opportunity";
q = group q by 'StageName';
q = foreach q generate 'StageName' as 'Stage', count() as 'Count';
```
