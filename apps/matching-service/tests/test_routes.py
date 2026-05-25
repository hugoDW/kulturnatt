import os
import sys
import uuid
from datetime import date
from unittest.mock import Mock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi.testclient import TestClient

import main
from auth import get_current_user
from internal_auth import require_internal_secret
from user import User


client = TestClient(main.app)


def dob_for_age(years: int) -> date:
    return date(date.today().year - years, 1, 1)


def make_user(**overrides) -> User:
    defaults = dict(
        user_id=uuid.uuid4(),
        username="testuser",
        dob=dob_for_age(25),
        gender="man",
        preferred_gender=["kvinna"],
        user_ranked_list=[],
        blocked_users=[],
        rejected_users=[],
        liked_users=[],
        matched_users=[],
        age_range=[20, 30],
        events=[],
        songs=[],
        albums=[],
        movies=[],
        artists=[],
        directors=[],
        actors=[],
        music_genre=[],
        movie_genre=[],
        shows=[],
        art=False,
        literature=[],
    )
    defaults.update(overrides)
    return User(**defaults)


def setup_function():
    main.app.dependency_overrides.clear()


def teardown_function():
    main.app.dependency_overrides.clear()


def test_health_returnerar_ok():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_swipe_like_anvander_inloggad_user_och_target(monkeypatch):
    current_id = uuid.uuid4()
    target_id = uuid.uuid4()
    current_user = make_user(user_id=current_id)
    target_user = make_user(user_id=target_id)
    perform_swipe = Mock(return_value={"status": "liked"})

    main.app.dependency_overrides[get_current_user] = lambda: current_id
    monkeypatch.setattr(main, "get_user", Mock(side_effect=[current_user, target_user]))
    monkeypatch.setattr(main, "perform_swipe", perform_swipe)

    response = client.post(
        "/swipe",
        json={"target_user_id": str(target_id), "action": "like"},
    )

    assert response.status_code == 200
    assert response.json() == {"status": "liked"}
    main.get_user.assert_any_call(current_id)
    main.get_user.assert_any_call(target_id)
    perform_swipe.assert_called_once_with(current_user, target_user, "like")


def test_swipe_returnerar_404_om_user_saknas(monkeypatch):
    current_id = uuid.uuid4()
    target_id = uuid.uuid4()

    main.app.dependency_overrides[get_current_user] = lambda: current_id
    monkeypatch.setattr(main, "get_user", Mock(side_effect=[make_user(user_id=current_id), None]))

    response = client.post(
        "/swipe",
        json={"target_user_id": str(target_id), "action": "like"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "User not found"


def test_swipe_validerar_action_innan_service_logik(monkeypatch):
    main.app.dependency_overrides[get_current_user] = lambda: uuid.uuid4()
    monkeypatch.setattr(main, "perform_swipe", Mock())

    response = client.post(
        "/swipe",
        json={"target_user_id": str(uuid.uuid4()), "action": "superlike"},
    )

    assert response.status_code == 422
    main.perform_swipe.assert_not_called()


def test_internal_recompute_kraver_internal_secret():
    response = client.post(f"/internal/recompute/{uuid.uuid4()}")

    assert response.status_code == 403


def test_internal_recompute_kallar_service(monkeypatch):
    user_id = uuid.uuid4()
    recompute_for_user = Mock()

    main.app.dependency_overrides[require_internal_secret] = lambda: None
    monkeypatch.setattr(main, "recompute_for_user", recompute_for_user)

    response = client.post(f"/internal/recompute/{user_id}")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    recompute_for_user.assert_called_once_with(user_id)


def test_internal_recompute_returnerar_500_vid_fel(monkeypatch):
    user_id = uuid.uuid4()

    main.app.dependency_overrides[require_internal_secret] = lambda: None
    monkeypatch.setattr(
        main,
        "recompute_for_user",
        Mock(side_effect=RuntimeError("profile-service unavailable")),
    )

    response = client.post(f"/internal/recompute/{user_id}")

    assert response.status_code == 500
    assert response.json()["detail"] == "profile-service unavailable"
