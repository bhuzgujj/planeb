create table if not exists rooms(
    id text primary key not null,
    names text not null,
    presisted boolean not null,
    created_at timestamp default CURRENT_TIMESTAMP,
    updated_at timestamp default null
);

create trigger if not exists updated_at_rooms
    after update
    on rooms
    for each row
begin
    update rooms set updated_at = CURRENT_TIMESTAMP where id = new.id;
end;

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

create table if not exists cards_set(
    id integer primary key not null,
    names text not null,
    created_at timestamp default CURRENT_TIMESTAMP,
    updated_at timestamp default null
);

create trigger if not exists updated_at_cards_set
after update
    on cards_set
    for each row
begin
    update cards_set set updated_at = CURRENT_TIMESTAMP where id = new.id;
end;

create table if not exists cards(
    id integer primary key not null,
    val integer not null,
    label text not null,
    cards_set_id integer not null,
    created_at timestamp default CURRENT_TIMESTAMP,
    updated_at timestamp default null,
    foreign key(cards_set_id) references cards_set(id) on delete cascade
);

create trigger if not exists updated_at_cards
after update
    on cards
    for each row
begin
    update cards set updated_at = CURRENT_TIMESTAMP where id = new.id;
end;