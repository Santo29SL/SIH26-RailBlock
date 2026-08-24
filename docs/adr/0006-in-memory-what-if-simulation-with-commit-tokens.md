# In-Memory What-If Simulation with Commit Tokens

We implement the What-If simulation engine as a pure in-memory calculation service that returns real-time impact metrics (`detention_delta_minutes`, `conflicting_trains`, `risk_score_delta`) alongside a cryptographically signed/hashed `commit_token`. The client can subsequently commit the simulated change to PostgreSQL via an explicit `POST /api/v1/optimizer/commit-simulation` endpoint.

Writing transient simulation records to the production database introduces high write amplification, lock contention, and garbage collection overhead during rapid slider scrubbing. In-memory evaluation keeps response latency under 50ms while maintaining zero database pollution.
