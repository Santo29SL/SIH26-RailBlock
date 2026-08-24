# Two-Tier Optimization Architecture (Offline MILP and Real-Time Greedy Heuristics)

We use a two-tier optimization architecture combining an offline Mixed-Integer Linear Programming (MILP) solver via Google OR-Tools for rolling 7-day master schedules with fast greedy heuristics (<30s) for real-time train delay rescheduling. 

Global MILP optimization on dense railway corridors is computationally prohibitive to solve dynamically under live operation deadlines, while pure greedy heuristics produce suboptimal track possession bundling. By separating master possession planning into batch runs and reserving localized heuristic shifts for active traffic disruptions (>20 min delays), we achieve both high shadow-block efficiency and sub-minute operational resilience.
