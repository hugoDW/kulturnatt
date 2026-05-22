#!/usr/bin/env python3
"""Seed Supabase auth users for apps/profile_test_auth_users.csv.

Requires the service role key (not the anon key):
  SUPABASE_URL=...
  SUPABASE_SERVICE_ROLE_KEY=...

Then import apps/profile_test_rows.csv into the public.profile table,
or run this script with --profiles to insert profile rows too.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import sys
import uuid
from pathlib import Path

import requests
from dotenv import load_dotenv
from supabase import create_client

ROOT = Path(__file__).resolve().parents[2]
AUTH_CSV = ROOT / "profile_test_auth_users.csv"
PROFILE_CSV = ROOT / "profile_test_rows.csv"

PROFILE_COLUMNS = [
    "username",
    "gender",
    "blocked_users",
    "rejected_users",
    "age_range",
    "events",
    "songs",
    "movies",
    "artists",
    "directors",
    "music_genre",
    "movie_genre",
    "id_profile",
    "matched_users",
    "liked_users",
    "preferred_gender",
    "user_ranked_list",
    "shows",
    "art",
    "literature",
    "dob",
    "bio",
    "profile_image_uri",
    "albums",
    "location",
    "actors",
]


def load_env() -> tuple[str, str]:
    load_dotenv()
    url = os.environ.get("SUPABASE_URL")
    service_role_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get(
        "SUPABASE_KEY"
    )
    if not url or not service_role_key:
        print(
            "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.",
            file=sys.stderr,
        )
        sys.exit(1)
    return url, service_role_key


def read_auth_users() -> list[dict[str, str]]:
    with AUTH_CSV.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def parse_pg_array(raw: str):
    if raw in ("", "[]"):
        return []
    text = raw.strip()
    if text.startswith('"') and text.endswith('"'):
        text = text[1:-1]
    if not (text.startswith("[") and text.endswith("]")):
        return raw
    inner = text[1:-1]
    if not inner:
        return []
    items: list[str] = []
    current: list[str] = []
    in_quotes = False
    i = 0
    while i < len(inner):
        ch = inner[i]
        if ch == '"':
            if in_quotes and i + 1 < len(inner) and inner[i + 1] == '"':
                current.append('"')
                i += 2
                continue
            in_quotes = not in_quotes
            i += 1
            continue
        if ch == "," and not in_quotes:
            items.append("".join(current))
            current = []
            i += 1
            continue
        current.append(ch)
        i += 1
    items.append("".join(current))
    return items


def parse_profile_row(row: dict[str, str]) -> dict:
    parsed: dict = {}
    for key, value in row.items():
        if key in {"art"}:
            parsed[key] = value.strip().lower() == "true"
            continue
        if key in {"bio", "dob", "location", "username", "gender", "profile_image_uri", "id_profile"}:
            parsed[key] = value or (None if key == "profile_image_uri" else "")
            continue
        if key.startswith("blocked_") or key.startswith("rejected_") or key.startswith("liked_") or key.startswith("matched_") or key in {
            "events",
            "songs",
            "movies",
            "artists",
            "directors",
            "music_genre",
            "movie_genre",
            "preferred_gender",
            "shows",
            "literature",
            "albums",
            "actors",
        }:
            parsed[key] = parse_pg_array(value)
            continue
        if key == "age_range":
            ages = parse_pg_array(value)
            parsed[key] = [int(ages[0]), int(ages[1])]
            continue
        if key == "user_ranked_list":
            parsed[key] = json.loads(value) if value and value != "[]" else []
            continue
        parsed[key] = value
    return parsed


def read_profiles() -> list[dict]:
    with PROFILE_CSV.open(newline="", encoding="utf-8") as handle:
        return [parse_profile_row(row) for row in csv.DictReader(handle)]


def seed_auth_users(supabase) -> None:
    for user in read_auth_users():
        payload = {
            "id": user["id"],
            "email": user["email"],
            "password": user["password"],
            "email_confirm": True,
            "user_metadata": {"username": user["username"]},
        }
        try:
            supabase.auth.admin.create_user(payload)
            print(f"created auth user {user['username']} ({user['email']})")
        except Exception as error:
            message = str(error)
            if "already been registered" in message or "already exists" in message:
                print(f"skipped existing auth user {user['username']}")
                continue
            raise


def seed_profiles(supabase) -> None:
    for profile in read_profiles():
        row = {key: profile[key] for key in PROFILE_COLUMNS if key in profile}
        supabase.table("profile").upsert(row, on_conflict="id_profile").execute()
        print(f"upserted profile {profile['username']}")


def recompute_matches(user_ids: list[uuid.UUID]) -> None:
    matching_url = os.environ.get("MATCHING_SERVICE_URL", "http://localhost:8002").rstrip("/")
    internal_secret = os.environ.get("INTERNAL_SECRET")
    if not internal_secret:
        print("Missing INTERNAL_SECRET — cannot trigger recompute.", file=sys.stderr)
        sys.exit(1)

    for user_id in user_ids:
        response = requests.post(
            f"{matching_url}/internal/recompute/{user_id}",
            headers={"X-Internal-Secret": internal_secret},
            timeout=30,
        )
        if response.status_code != 200:
            print(
                f"recompute failed for {user_id}: {response.status_code} {response.text}",
                file=sys.stderr,
            )
            continue
        print(f"recomputed matches for {user_id}")


def all_profile_ids() -> list[uuid.UUID]:
    ids = {uuid.UUID(user["id"]) for user in read_auth_users()}
    for profile in read_profiles():
        ids.add(uuid.UUID(profile["id_profile"]))
    return sorted(ids)


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed Kulturnatt test users in Supabase")
    parser.add_argument(
        "--profiles",
        action="store_true",
        help="Also upsert rows from apps/profile_test_rows.csv into public.profile",
    )
    parser.add_argument(
        "--recompute",
        action="store_true",
        help="Trigger matching-service recompute for all seeded profile ids",
    )
    args = parser.parse_args()

    url, service_role_key = load_env()
    supabase = create_client(url, service_role_key)

    seed_auth_users(supabase)
    if args.profiles:
        seed_profiles(supabase)
    if args.recompute:
        recompute_matches(all_profile_ids())

    print("Done.")


if __name__ == "__main__":
    main()
