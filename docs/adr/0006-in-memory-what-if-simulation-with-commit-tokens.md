# In-Memory What-If Simulation with HMAC Commit Tokens

We implement the What-If simulation engine as a pure in-memory calculation service that returns real-time impact metrics (`detention_delta_minutes`, `conflicting_trains`, `risk_score_delta`) alongside a cryptographically signed `HMAC-SHA256` token (`commit_token`) with a 15-minute Time-to-Live (TTL). The client can subsequently commit the simulated change to PostgreSQL via an explicit `POST /api/v1/optimizer/commit-simulation` endpoint using the verified token.

Writing transient simulation records to the production database introduces high write amplification, lock contention, and garbage collection overhead during rapid slider scrubbing. In-memory evaluation keeps response latency under 15ms while maintaining zero database pollution and preventing replay/tampering attacks via HMAC signature verification.
