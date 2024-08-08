create table users(
    id text primary key asc,
    names text not null,
    moderator boolean not null default 0
);

create table tasks(
    id integer primary key asc,
    names text not null,
    comments text default null,
    points_selected text default null
);

create table votes(
    id integer primary key asc,
    user_id text not null,
    task_id integer not null,
    vote text not null,
    foreign key(user_id) references users(id) on delete cascade,
    foreign key(task_id) references tasks(id) on delete cascade
);

create table metadatas(
    keys text not null,
    vals text
);