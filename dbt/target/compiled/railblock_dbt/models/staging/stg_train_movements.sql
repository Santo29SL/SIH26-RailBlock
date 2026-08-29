with source as (
    select * from "railblock"."public"."train_movements"
),

cleaned as (
    select
        id as movement_id,
        train_id,
        section_id,
        departure_time,
        arrival_time,
        day_of_week,
        movement_type,
        is_active
    from source
    where is_active = true
)

select * from cleaned