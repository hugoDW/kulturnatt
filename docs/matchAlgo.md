# Match algorithm — design notes

What happens when a swipe turns into a match. Swipe scoring is in
[swipeAlgo.md](swipeAlgo.md); the endpoint and response shape are in
[documentation.md](documentation.md). Lives in `apps/matching-service/matchAlgo.py`.

## When a like lands

A like becomes a match only when it's mutual — the other person has already liked you.
That check is `is_mutual_like`.

## Creating the match

On a mutual like:

- both profiles are flagged as matched (each user id is added to the other's
  `matched_users`)
- the shared interests are collected — which events, artists, songs, movies and so on the
  two have in common (`get_shared_interests`)

The shared interests are what the `/swipe` response sends back so the app can show the two
people why they matched.
