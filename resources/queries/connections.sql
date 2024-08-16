create table if not exists users(
    id text primary key,
    vote text default null
);

create table if not exists connections(
    id text primary key,
    listed boolean not null default 0,
    setted boolean not null default 0,
    rooms_id text null,
    users_id text null,
    foreign key(rooms_id) references rooms(id) on delete cascade,
    foreign key(users_id) references users(id) on delete cascade
);

create table if not exists rooms(
    id text primary key,
    task text default null
);