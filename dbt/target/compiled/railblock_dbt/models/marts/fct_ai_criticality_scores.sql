with defects as (
    select * from "railblock"."public_intermediate"."int_consolidated_defects"
)

select
    request_id,
    request_code,
    section_id,
    department,
    activity_type,
    duration_minutes,
    days_overdue,
    primary_metric,
    metric_type,
    -- Analytical domain calibration score
    case
        when department = 'TRACK' and metric_type = 'TGI_DEVIATION' and primary_metric >= 80 then 90.0
        when days_overdue >= 14 then 85.0 + least(15.0, days_overdue::float)
        when days_overdue >= 7 then 65.0 + (days_overdue * 1.5)
        else 45.0 + (days_overdue * 2.0)
    end as calibrated_criticality_index,
    priority,
    status
from defects