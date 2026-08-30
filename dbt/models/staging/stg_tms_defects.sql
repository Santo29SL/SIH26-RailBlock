with source as (
    select * from {{ source('cris_sources', 'maintenance_requests') }}
    where department = 'TRACK'
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
        (metadata_json->>'days_overdue')::int as days_overdue,
        (metadata_json->>'tgi_deviation')::float as tgi_deviation,
        (metadata_json->>'speed_restriction_kmh')::int as speed_restriction_kmh,
        metadata_json->>'usfd_flaw_severity' as usfd_flaw_severity,
        (metadata_json->>'traffic_gmt')::float as traffic_gmt
    from source
)

select * from cleaned
