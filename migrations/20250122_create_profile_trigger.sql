create or replace function public.create_profile_on_user_signup()
returns trigger
language plpgsql
security definer
as $$
begin
    insert into public.profiles (user_id)
    values (new.id)
    on conflict do nothing;
    return new;
end;
$$;

drop trigger if exists create_profile_on_user_signup on auth.users;
create trigger create_profile_on_user_signup
after insert on auth.users
for each row execute procedure public.create_profile_on_user_signup();
