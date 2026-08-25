# Tiered Train Detention and Priority Timetable Protection in Optimizer

We enforce a tiered train detention model in the Google OR-Tools optimization engine:
1. **Tier 1 (Rajdhani, Vande Bharat, Shatabdi)**: Hard constraint with zero detention permitted. Maintenance blocks can only be granted in non-conflicting gaps.
2. **Tier 2 (Express, Superfast, Passenger)**: Soft constraint with a high linear penalty ($\beta_1$). Blocks may shift regular passenger services by $\le 15\text{ mins}$ only if the defect Criticality Index is extremely high.
3. **Tier 3 (Freight / Goods)**: Soft constraint with low penalty ($\beta_2$). Goods trains can be regulated in loop lines/sidings to accommodate maintenance possessions.

A rigid zero-detention policy across all trains prevents essential safety-critical track maintenance on congested trunk routes, while an unconstrained model causes severe public timetable disruptions. Tiered protection guarantees VIP passenger punctuality while ensuring critical infrastructure defects are remediated promptly.
