with source as (
    select * from {{ source('cris_sources', 'maintenance_requests') }}
    where department = 'TRACTION'
),

cleaned as (
    select
        id as request_id,
        request_code,
        section_id,
        department,
        activity_type,
        duration_minutes,
        priority,
        deadline,
        status,
        (metadata_json->>'ohe_insulator_wear')::float as ohe_insulator_wear,
        (metadata_json->>'days_overdue')::int as days_overdue
    from source
)

select * from cleaned
