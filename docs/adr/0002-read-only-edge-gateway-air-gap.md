# Read-Only Edge Gateway for RailNet Air-Gap Cybersecurity Compliance

We enforce a Read-Only Edge Gateway pattern where RailBlock never writes directly to Indian Railways production databases (TMS, SMMS, TDMS, COA), but instead ingests read-only snapshots and pushes scheduled blocks as digital draft proposals into CRIS BDMS.

Direct bidirectional database access to core railway systems violates RailNet security policies. Exporting standardized draft JSON proposals for human Station Master verification and statutory Form T/351 sign-off ensures compliance while automating multi-department coordination.
