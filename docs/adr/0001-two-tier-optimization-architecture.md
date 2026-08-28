# Two-Tier Optimization Architecture (Offline CP-SAT and Real-Time Fast Greedy Heuristics)

We use a two-tier optimization architecture combining a global exact Constraint Programming solver via Google OR-Tools CP-SAT for multi-horizon rolling master schedules (24-hour tactical, 7-day weekly, and 30-day monthly plans via `horizon_days=7|30`) with sub-second fast greedy heuristics (<1 ms time-shift computation) for real-time train delay rescheduling.

Global constraint programming optimization on dense railway corridors is computationally intensive to re-solve dynamically under live second-by-second operation deadlines, while pure greedy heuristics produce suboptimal track possession bundling. By separating master possession planning into batch runs and reserving localized heuristic shifts for active traffic disruptions (>20 min delays), we achieve both high shadow-block efficiency and sub-second operational resilience.
