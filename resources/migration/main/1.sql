create if not exist users(
    id text primary key not null,
    ip text default null,
    created_at timestamp default CURRENT_TIMESTAMP,
    updated_at timestamp default null
);

create trigger if not exists updated_at_users
    after update
    on users
    for each row
begin
    update rooms set updated_at = CURRENT_TIMESTAMP where id = new.id;
end;