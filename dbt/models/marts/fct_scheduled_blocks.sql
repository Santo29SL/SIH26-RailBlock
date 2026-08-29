with candidates as (
    select * from {{ ref('int_joint_shadow_candidates') }}
),

gaps as (
    select * from {{ ref('fct_corridor_gaps') }}
),

matched as (
    select
        c.section_id,
        c.section_code,
        c.feeding_post_name,
        c.total_requests_bundled,
        c.departments_count,
        c.max_work_duration,
        g.day_of_week,
        g.gap_start_time,
        g.gap_end_time,
        g.usable_maintenance_minutes,
        (c.max_work_duration * (c.departments_count - 1) * 0.8) / 60.0 as shadow_hours_saved
    from candidates c
    join gaps g on c.section_id = g.section_id
    where g.usable_maintenance_minutes >= c.max_work_duration
)

select * from matched
