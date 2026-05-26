create table if not exists public.social_media (
  profile_id uuid primary key references public.profile(id_profile) on update cascade on delete cascade,
  instagram text,
  facebook text
);

insert into public.social_media (profile_id, instagram, facebook)
select
  id_profile,
  case
    when social_media is not null
      and social_media <> ''
      and left(trim(social_media), 1) = '{'
      then coalesce((social_media::jsonb ->> 'instagram'), '')
    when social_media is not null
      and social_media <> ''
      then social_media
    else ''
  end as instagram,
  case
    when social_media is not null
      and social_media <> ''
      and left(trim(social_media), 1) = '{'
      then coalesce((social_media::jsonb ->> 'facebook'), '')
    else ''
  end as facebook
from public.profile
where social_media is not null
  and social_media <> ''
on conflict (profile_id) do update
set
  instagram = excluded.instagram,
  facebook = excluded.facebook;
