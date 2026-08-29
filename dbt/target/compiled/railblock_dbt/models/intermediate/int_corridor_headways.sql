with movements as (
    select
        movement_id,
        train_id,
        section_id,
        day_of_week,
        departure_time,
        arrival_time,
        lag(arrival_time) over (
            partition by section_id, day_of_week
            order by departure_time
        ) as prev_train_arrival
    from "railblock"."public_staging"."stg_train_movements"
),

headways as (
    select
        section_id,
        day_of_week,
        prev_train_arrival as gap_start_time,
        departure_time as gap_end_time,
        extract(epoch from (departure_time - prev_train_arrival)) / 60 as headway_minutes
    from movements
    where prev_train_arrival is not null
)

select * from headways
where headway_minutes >= 60