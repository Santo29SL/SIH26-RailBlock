with tms as (
    select
        request_id,
        request_code,
        section_id,
        department,
        activity_type,
        duration_minutes,
        priority,
        deadline,
        status,
        days_overdue,
        coalesce(tgi_deviation, 0) as primary_metric,
        'TGI_DEVIATION' as metric_type
    from "railblock"."public_staging"."stg_tms_defects"
),

smms as (
    select
        request_id,
        request_code,
        section_id,
        department,
        activity_type,
        duration_minutes,
        priority,
        deadline,
        status,
        days_overdue,
        coalesce(point_failure_risk, 0) as primary_metric,
        'POINT_JAM_RISK' as metric_type
    from "railblock"."public_staging"."stg_smms_defects"
),

tdms as (
    select
        request_id,
        request_code,
        section_id,
        department,
        activity_type,
        duration_minutes,
        priority,
        deadline,
        status,
        days_overdue,
        coalesce(ohe_insulator_wear, 0) as primary_metric,
        'OHE_WEAR' as metric_type
    from "railblock"."public_staging"."stg_tdms_defects"
),

combined as (
    select * from tms
    union all
    select * from smms
    union all
    select * from tdms
)

select * from combined