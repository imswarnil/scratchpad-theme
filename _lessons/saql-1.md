---
title: "What SAQL actually is"
course: saql-from-scratch
module: "Getting oriented"
lesson: 1
minutes: 12
description: "Where SAQL sits between the dataset and the chart."
date: 2025-05-01
---

## What SAQL actually is

Where SAQL sits between the dataset and the chart.

```sql
q = load "Opportunity";
q = group q by 'StageName';
q = foreach q generate 'StageName' as 'Stage', count() as 'Count';
```
