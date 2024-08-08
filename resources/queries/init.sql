create table if not exists rooms(
    id text primary key not null,
    names text not null,
    presisted boolean not null,
    created_at timestamp default CURRENT_TIMESTAMP,
    updated_at timestamp default null
);

create table if not exists migrated(
    id integer primary key not null,
    created_at timestamp default CURRENT_TIMESTAMP,
    updated_at timestamp default null
);

create trigger if not exists updated_at_migrated
after update
    on migrated
    for each row
begin
    update migrated set updated_at = CURRENT_TIMESTAMP where id = new.id;
end;

create trigger if not exists updated_at_rooms
    after update
    on rooms
    for each row
begin
    update rooms set updated_at = CURRENT_TIMESTAMP where id = new.id;
end;