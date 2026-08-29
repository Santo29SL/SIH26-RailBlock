with defects as (
    select * from "railblock"."public_intermediate"."int_consolidated_defects"
),

sections as (
    select * from "railblock"."public_staging"."stg_sections"
),

grouped as (
    select
        d.section_id,
        s.section_code,
        s.feeding_post_name,
        count(d.request_id) as total_requests_bundled,
        count(distinct d.department) as departments_count,
        max(d.duration_minutes) as max_work_duration,
        sum(d.days_overdue) as cumulative_overdue_days
    from defects d
    join sections s on d.section_id = s.section_id
    group by d.section_id, s.section_code, s.feeding_post_name
)

select * from grouped
where departments_count >= 2