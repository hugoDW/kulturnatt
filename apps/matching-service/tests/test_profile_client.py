import os
import sys
import uuid
from datetime import date
from unittest.mock import Mock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import profile_client
from profile_client import get_user, save_like, save_match, save_ranked_list, save_reject


def user_payload(user_id: uuid.UUID | None = None) -> dict:
    return {
        "user_id": str(user_id or uuid.uuid4()),
        "username": "testuser",
        "dob": str(date(date.today().year - 25, 1, 1)),
        "gender": "man",
        "preferred_gender": ["kvinna"],
        "user_ranked_list": [],
        "blocked_users": [],
        "rejected_users": [],
        "liked_users": [],
        "matched_users": [],
        "age_range": [20, 30],
        "events": [],
        "songs": [],
        "albums": [],
        "movies": [],
        "artists": [],
        "directors": [],
        "actors": [],
        "music_genre": [],
        "movie_genre": [],
        "shows": [],
        "art": False,
        "literature": [],
    }


def response(status_code: int = 200, payload: dict | None = None) -> Mock:
    item = Mock()
    item.status_code = status_code
    item.json.return_value = payload or {}
    item.raise_for_status = Mock()
    return item


def test_get_user_returnerar_user_fran_profile_service(monkeypatch):
    user_id = uuid.uuid4()
    get = Mock(return_value=response(payload=user_payload(user_id)))

    monkeypatch.setattr(profile_client.requests, "get", get)

    user = get_user(user_id)

    assert user is not None
    assert user.user_id == user_id
    get.assert_called_once_with(
        f"{profile_client.PROFILE_SERVICE_URL}/internal/users/{user_id}",
        headers={"X-Internal-Secret": profile_client.INTERNAL_SECRET},
        timeout=30,
    )


def test_get_user_returnerar_none_vid_404(monkeypatch):
    get = Mock(return_value=response(status_code=404))

    monkeypatch.setattr(profile_client.requests, "get", get)

    assert get_user(uuid.uuid4()) is None


def test_save_ranked_list_skickar_ranked_list_payload(monkeypatch):
    user_id = uuid.uuid4()
    target_id = uuid.uuid4()
    put = Mock(return_value=response())
    ranked_list = [{"user_id": str(target_id), "score": 42}]

    monkeypatch.setattr(profile_client.requests, "put", put)

    save_ranked_list(user_id, ranked_list)

    put.assert_called_once_with(
        f"{profile_client.PROFILE_SERVICE_URL}/internal/users/{user_id}/ranked_list",
        headers={"X-Internal-Secret": profile_client.INTERNAL_SECRET},
        json={"ranked_list": ranked_list},
        timeout=30,
    )


def test_save_like_serialiserar_uuid_listan(monkeypatch):
    user_id = uuid.uuid4()
    liked_id = uuid.uuid4()
    put = Mock(return_value=response())

    monkeypatch.setattr(profile_client.requests, "put", put)

    save_like(user_id, [liked_id])

    put.assert_called_once_with(
        f"{profile_client.PROFILE_SERVICE_URL}/internal/users/{user_id}/likes",
        headers={"X-Internal-Secret": profile_client.INTERNAL_SECRET},
        json={"liked_users": [str(liked_id)]},
    )


def test_save_reject_serialiserar_uuid_listan(monkeypatch):
    user_id = uuid.uuid4()
    rejected_id = uuid.uuid4()
    put = Mock(return_value=response())

    monkeypatch.setattr(profile_client.requests, "put", put)

    save_reject(user_id, [rejected_id])

    put.assert_called_once_with(
        f"{profile_client.PROFILE_SERVICE_URL}/internal/users/{user_id}/rejects",
        headers={"X-Internal-Secret": profile_client.INTERNAL_SECRET},
        json={"rejected_users": [str(rejected_id)]},
    )


def test_save_match_skickar_bada_anvandarnas_likes_och_matches(monkeypatch):
    user_a_id = uuid.uuid4()
    user_b_id = uuid.uuid4()
    post = Mock(return_value=response())

    monkeypatch.setattr(profile_client.requests, "post", post)

    save_match(
        user_a_id,
        [],
        [user_b_id],
        user_b_id,
        [],
        [user_a_id],
    )

    post.assert_called_once_with(
        f"{profile_client.PROFILE_SERVICE_URL}/internal/match",
        headers={"X-Internal-Secret": profile_client.INTERNAL_SECRET},
        json={
            "user_a_id": str(user_a_id),
            "a_liked": [],
            "a_matched": [str(user_b_id)],
            "user_b_id": str(user_b_id),
            "b_liked": [],
            "b_matched": [str(user_a_id)],
        },
    )
