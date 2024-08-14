create table users(
    id text primary key asc,
    names text not null,
    moderator boolean not null default 0,
    created_at timestamp default CURRENT_TIMESTAMP,
    updated_at timestamp default null
);

create trigger if not exists updated_at_users
after update
    on users
    for each row
begin
    update users set updated_at = CURRENT_TIMESTAMP where id = new.id;
end;

create table tasks(
    id text primary key asc,
    task_no text null,
    names text not null,
    comments text default null,
    card_id text null,
    created_at timestamp default CURRENT_TIMESTAMP,
    updated_at timestamp default null,
    foreign key(card_id) references cards(id) on delete cascade
);

create trigger if not exists updated_at_tasks
after update
    on tasks
    for each row
begin
    update tasks set updated_at = CURRENT_TIMESTAMP where id = new.id;
end;

create table cards(
    id text primary key asc,
    val float not null,
    label text not null,
    created_at timestamp default CURRENT_TIMESTAMP,
    updated_at timestamp default null
);

create trigger if not exists updated_at_cards
after update
    on cards
    for each row
begin
    update cards set updated_at = CURRENT_TIMESTAMP where id = new.id;
end;

create table votes(
    id integer primary key asc,
    user_id text not null,
    task_id text not null,
    card_id text not null,
    created_at timestamp default CURRENT_TIMESTAMP,
    updated_at timestamp default null,
    foreign key(card_id) references cards(id) on delete cascade,
    foreign key(user_id) references users(id) on delete cascade,
    foreign key(task_id) references tasks(id) on delete cascade
);

create trigger if not exists updated_at_votes
after update
    on votes
    for each row
begin
    update votes set updated_at = CURRENT_TIMESTAMP where id = new.id;
end;

create table metadatas(
    keys text not null,
    vals text,
    created_at timestamp default CURRENT_TIMESTAMP,
    updated_at timestamp default null
);

create trigger if not exists updated_at_metadatas
after update
    on metadatas
    for each row
begin
    update metadatas set updated_at = CURRENT_TIMESTAMP where id = new.id;
end;