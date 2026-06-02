# Swipe algorithm — design notes

The reasoning behind the swipe scoring. The exact scoring weights and the implemented
endpoints are in [documentation.md](documentation.md); matching is in
[matchAlgo.md](matchAlgo.md). Lives in `apps/matching-service/swipeAlgo.py`.

## Basic checks first

A candidate is dropped before scoring if any of these fail:

- the age ranges line up both ways (each person is inside the other's `age_range`)
- the gender matches what each person prefers
- the candidate isn't blocked

## Scoring

Each remaining candidate gets a score from how much you have in common: shared events
count for the most, then songs and movies, then artists and directors, then genres. The
exact weights are in [documentation.md](documentation.md).

The score is always computed between two specific people, never a fixed property of one
profile. The list is shown sorted by score, highest first.

## Already-shown profiles

Profiles that have been shown are flagged so they don't keep reappearing.

## New users

To take part in matching a new user needs the basics filled in — age, gender, name — and
at least one taste category. Without that there's nothing to score against.

## When it runs

The ranked list is recomputed when a profile is saved or updated, not on a timer.

## The rejected list

Rejects (and unmatches) go into a separate sorted list, scored with the same algorithm.
It's kept out of the main flow and shown only if the user chooses to look at it, or when
they change their settings.

## Best-match highlight

The strongest candidate can be highlighted based on how much is shared — both the count
of shared items and the total score.

## Keeping the cost down

Recomputing every list on a schedule doesn't work: it's slow and pointless when nothing
has changed. Instead the recompute is targeted. When one user changes their profile, only
two sets of lists are redone: that user's, and the lists of everyone who already had them
as a candidate (and still passes the basic checks). This is what
`recompute_for_user` does.
