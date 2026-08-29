with headways as (
    select * from "railblock"."public_intermediate"."int_corridor_headways"
),

sections as (
    select * from "railblock"."public_marts"."dim_railway_sections"
)

select
    h.section_id,
    s.section_code,
    h.day_of_week,
    h.gap_start_time,
    h.gap_end_time,
    h.headway_minutes as raw_gap_minutes,
    (h.headway_minutes - 30) as usable_maintenance_minutes, -- 15m safety buffer on each side
    case
        when (h.headway_minutes - 30) >= 120 then 'MAJOR_CORRIDOR_BLOCK'
        when (h.headway_minutes - 30) >= 60 then 'MEDIUM_CORRIDOR_BLOCK'
        else 'SHORT_SHADOW_GAP'
    end as gap_category
from headways h
join sections s on h.section_id = s.section_id
where (h.headway_minutes - 30) > 0