---
title: "TIL: SAQL windowing for running totals"
date: 2025-09-02
tags: [saql, analytics]
lang: SAQL
preview: |
  q = load "opportunities";
  q = group q by 'CloseMonth';
  q = foreach q generate 'CloseMonth' as 'Month',
        sum('Amount') as 'Amount',
        sum(sum('Amount')) over ([..0] partition by all
          order by 'CloseMonth') as 'Running';
excerpt: "A running total is one windowing clause — here's the frame that makes it cumulative."
---

A running total in SAQL is just a `windowing` function over an ordered grouping:

```sql
q = load "opportunities";
q = group q by 'CloseMonth';
q = foreach q generate 'CloseMonth' as 'Month',
      sum('Amount') as 'Amount',
      sum(sum('Amount')) over ([..0] partition by all order by 'CloseMonth') as 'Running';
```

The `[..0]` frame means "from the start of the partition up to the current row" — that's
what produces the cumulative sum. Swap `partition by all` for a real field to reset the
total per segment.
