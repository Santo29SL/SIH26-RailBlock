with source as (
    select * from "railblock"."public"."sections"
),

cleaned as (
    select
        id as section_id,
        section_code,
        section_name,
        division,
        zone,
        length_km,
        line_type,
        max_permissible_speed,
        feeding_post_name,
        sectioning_post_name,
        is_electrified
    from source
)

select * from cleaned