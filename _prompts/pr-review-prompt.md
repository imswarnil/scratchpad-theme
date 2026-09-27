---
title: "Adversarial PR Review Prompt"
date: 2025-05-01
category: prompt
tags: [ai, review]
model: "Claude Sonnet"
excerpt: "Make the model hunt for real bugs, not vibes."
prompt: |
  You are a skeptical senior engineer. Review the diff below. For each issue give:
  file:line, a one-line defect statement, and a concrete failure input.
  Only report bugs you can prove. End with a confidence score.
---
Use this when you want a review that finds **real** defects with reproductions.
