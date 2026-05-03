import sys
import os
import uuid
from unittest.mock import patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from user import User
from services import perform_swipe


def make_user(**overrides) -> User:
    defaults = dict(
        user_id=uuid.uuid4(),
        username="testuser",
        age=25,
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
        movies=[],
        artists=[],
        directors=[],
        music_genre=[],
        movie_genre=[],
        shows=[],
        art=False,
        literature=[],
    )
    defaults.update(overrides)
    return User(**defaults)


# --- perform_swipe: like ---

@patch("services.save_like")
def test_like_utan_ömsesidighet_returnerar_liked(mock_save_like):
    # om B inte har gillat A ska svaret vara "liked", inte "match"
    user_a = make_user()
    user_b = make_user()
    result = perform_swipe(user_a, user_b, "like")
    assert result == {"status": "liked"}


@patch("services.save_like")
def test_like_sparas_i_databasen(mock_save_like):
    # save_like ska anropas med rätt användar-id och uppdaterad lista
    user_a = make_user()
    user_b = make_user()
    perform_swipe(user_a, user_b, "like")
    mock_save_like.assert_called_once_with(user_a.user_id, [user_b.user_id])


@patch("services.save_like")
def test_like_lägger_till_i_liked_users(mock_save_like):
    # efter like ska target finnas i current users liked_users i minnet
    user_a = make_user()
    user_b = make_user()
    perform_swipe(user_a, user_b, "like")
    assert user_b.user_id in user_a.liked_users


# --- perform_swipe: ömsesidig like → match ---

@patch("services.save_match")
@patch("services.save_like")
def test_ömsesidig_like_returnerar_match(mock_save_like, mock_save_match):
    # om B redan har gillat A ska svaret vara "match"
    user_a = make_user()
    user_b = make_user()
    user_b.liked_users.append(user_a.user_id)
    result = perform_swipe(user_a, user_b, "like")
    assert result["status"] == "match"


@patch("services.save_match")
@patch("services.save_like")
def test_match_innehåller_gemensamma_intressen(mock_save_like, mock_save_match):
    # matchsvaret ska innehålla shared med gemensamma intressen
    user_a = make_user(events=["konsert"], movies=["Inception"])
    user_b = make_user(events=["konsert"], movies=["Inception"])
    user_b.liked_users.append(user_a.user_id)
    result = perform_swipe(user_a, user_b, "like")
    assert "shared" in result
    assert "konsert" in result["shared"]["events"]
    assert "Inception" in result["shared"]["movies"]


@patch("services.save_match")
@patch("services.save_like")
def test_match_sparas_i_databasen(mock_save_like, mock_save_match):
    # save_match ska anropas när det blir en match
    user_a = make_user()
    user_b = make_user()
    user_b.liked_users.append(user_a.user_id)
    perform_swipe(user_a, user_b, "like")
    mock_save_match.assert_called_once()


# --- perform_swipe: reject ---

@patch("services.save_reject")
def test_reject_returnerar_rejected(mock_save_reject):
    # avvisning ska returnera "rejected"
    user_a = make_user()
    user_b = make_user()
    result = perform_swipe(user_a, user_b, "reject")
    assert result == {"status": "rejected"}


@patch("services.save_reject")
def test_reject_sparas_i_databasen(mock_save_reject):
    # save_reject ska anropas med rätt användar-id och uppdaterad lista
    user_a = make_user()
    user_b = make_user()
    perform_swipe(user_a, user_b, "reject")
    mock_save_reject.assert_called_once_with(user_a.user_id, [user_b.user_id])


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])
