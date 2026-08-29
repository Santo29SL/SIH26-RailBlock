# 4+1-Tier Role-Based Access Control (RBAC) and Statutory Divisional Block Sanction Escalation

We implement a 4+1-Tier Role-Based Access Control (RBAC) architecture enforcing Indian Railways statutory governance:
1. `ADMIN`: System configuration, user provisioning, and audit logs.
2. `SECTION_CONTROLLER`: Schedule generation, What-If simulation, and final corridor possession granting.
3. `STATION_MASTER`: Private Number issuance for Form T/351 Disconnection and Reconnection notices.
4. `DEPARTMENT_ENGINEER`: Maintenance request registration and multi-department pre-approval consent (Track, Signal, Traction).
5. `DIVISIONAL_AUTHORITY`: Sanctioning authority for major possessions.

Per Railway Board letter dated 16.06.2022, Section Controllers cannot unilaterally grant mega-blocks without higher administrative concurrence. The system enforces an automated escalation workflow where any traffic block exceeding 4 hours or non-interlocking (NI) work exceeding 3 days mandates digital sign-off from a `DIVISIONAL_AUTHORITY` (DRM / GM level) prior to Station Master Private Number release.
