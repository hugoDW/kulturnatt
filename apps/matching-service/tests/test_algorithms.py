import sys
import os
import uuid
from datetime import date

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from user import User
from swipeAlgo import filter_users, scoring_users
from matchAlgo import is_mutual_like, create_match, get_shared_interests


def dob_for_age(years: int) -> date:
    # Jan 1 så att födelsedagen alltid hunnit passera oavsett när testet körs
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


# --- filter_users ---

def test_filtrerar_bort_sig_själv():
    # en användare ska inte dyka upp i sin egen swipe-lista
    user = make_user(gender="kvinna", preferred_gender=["man"])
    result = filter_users(user, [user])
    assert user not in result


def test_filtrerar_bort_fel_kön():
    # om användare B inte är intresserad av användare A:s kön ska B filtreras bort
    user_a = make_user(gender="man", preferred_gender=["kvinna"], dob=dob_for_age(25), age_range=[20, 30])
    user_b = make_user(gender="kvinna", preferred_gender=["kvinna"], dob=dob_for_age(25), age_range=[20, 30])
    result = filter_users(user_a, [user_a, user_b])
    assert user_b not in result


def test_filtrerar_bort_utanför_åldersintervall():
    # användare utanför önskat åldersintervall ska inte visas
    user_a = make_user(gender="man", preferred_gender=["kvinna"], dob=dob_for_age(25), age_range=[20, 30])
    user_b = make_user(gender="kvinna", preferred_gender=["man"], dob=dob_for_age(50), age_range=[20, 30])
    result = filter_users(user_a, [user_a, user_b])
    assert user_b not in result


def test_filtrerar_bort_blockerade():
    # blockerade användare ska aldrig visas
    user_a = make_user(gender="man", preferred_gender=["kvinna"], dob=dob_for_age(25), age_range=[20, 30])
    user_b = make_user(gender="kvinna", preferred_gender=["man"], dob=dob_for_age(25), age_range=[20, 30])
    user_a.blocked_users.append(user_b.user_id)
    result = filter_users(user_a, [user_a, user_b])
    assert user_b not in result


def test_filtrerar_bort_redan_avvisade():
    # användare som redan swipats bort ska inte visas igen
    user_a = make_user(gender="man", preferred_gender=["kvinna"], dob=dob_for_age(25), age_range=[20, 30])
    user_b = make_user(gender="kvinna", preferred_gender=["man"], dob=dob_for_age(25), age_range=[20, 30])
    user_a.rejected_users.append(user_b.user_id)
    result = filter_users(user_a, [user_a, user_b])
    assert user_b not in result


def test_godkänd_användare_passerar_filter():
    # en matchande användare ska komma igenom alla filter
    user_a = make_user(gender="man", preferred_gender=["kvinna"], dob=dob_for_age(25), age_range=[20, 30])
    user_b = make_user(gender="kvinna", preferred_gender=["man"], dob=dob_for_age(25), age_range=[20, 30])
    result = filter_users(user_a, [user_a, user_b])
    assert user_b in result


# --- scoring_users ---

def test_fler_gemensamma_intressen_ger_högre_score():
    # användare med fler gemensamma intressen ska rankas högre
    user_a = make_user(events=["konsert", "teater"], movies=["Inception"])
    user_b = make_user(events=["konsert", "teater"], movies=["Inception"])
    user_c = make_user(events=[], movies=[])
    ranked = scoring_users(user_a, [user_b, user_c])
    assert ranked[0][0] == user_b


def test_gemensamma_event_väger_tyngst():
    # events har högst multiplier så gemensamma events ska ge mer poäng än gemensamma filmer
    user_a = make_user(events=["konsert"], movies=[])
    user_b = make_user(events=["konsert"], movies=[])
    user_c = make_user(events=[], movies=["Inception", "Matrix", "Interstellar",
                                          "The Dark Knight", "Dunkirk", "Tenet",
                                          "Oppenheimer", "Memento", "Prestige", "Batman"])
    ranked = scoring_users(user_a, [user_b, user_c])
    assert ranked[0][0] == user_b


def test_noll_gemensamma_intressen_ger_noll_score():
    # om inga intressen delas ska poängen vara 0
    user_a = make_user(events=["konsert"], movies=["Inception"])
    user_b = make_user(events=[], movies=[])
    ranked = scoring_users(user_a, [user_b])
    assert ranked[0][1] == 0


# --- is_mutual_like ---

def test_ömsesidig_like_känns_igen():
    # match kräver att båda har gillat varandra
    user_a = make_user()
    user_b = make_user()
    user_a.liked_users.append(user_b.user_id)
    user_b.liked_users.append(user_a.user_id)
    assert is_mutual_like(user_a, user_b) is True


def test_ensidig_like_är_inte_match():
    # om bara en har gillat ska det inte bli match
    user_a = make_user()
    user_b = make_user()
    user_a.liked_users.append(user_b.user_id)
    assert is_mutual_like(user_a, user_b) is False


# --- create_match ---

def test_match_skapar_korrekt_resultat():
    # vid ömsesidig like ska båda hamna i varandras matched_users
    user_a = make_user()
    user_b = make_user()
    user_a.liked_users.append(user_b.user_id)
    user_b.liked_users.append(user_a.user_id)
    result = create_match(user_a, user_b)
    assert result is not None
    assert user_b.user_id in user_a.matched_users
    assert user_a.user_id in user_b.matched_users


def test_match_tar_bort_från_liked_users():
    # efter match ska ingen längre ligga i liked_users
    user_a = make_user()
    user_b = make_user()
    user_a.liked_users.append(user_b.user_id)
    user_b.liked_users.append(user_a.user_id)
    create_match(user_a, user_b)
    assert user_b.user_id not in user_a.liked_users
    assert user_a.user_id not in user_b.liked_users


def test_ingen_match_utan_ömsesidig_like():
    # create_match ska returnera None om det inte är ömsesidigt
    user_a = make_user()
    user_b = make_user()
    user_a.liked_users.append(user_b.user_id)
    result = create_match(user_a, user_b)
    assert result is None


# --- get_shared_interests ---

def test_gemensamma_intressen_returneras_korrekt():
    # shared interests ska bara innehålla det som båda har
    user_a = make_user(events=["konsert", "teater"], movies=["Inception"])
    user_b = make_user(events=["konsert", "festival"], movies=["Inception", "Matrix"])
    shared = get_shared_interests(user_a, user_b)
    assert "konsert" in shared["events"]
    assert "teater" not in shared["events"]
    assert "Inception" in shared["movies"]
    assert "Matrix" not in shared["movies"]


def test_inga_gemensamma_intressen_ger_tomma_listor():
    # om inget delas ska alla listor vara tomma
    user_a = make_user(events=["konsert"], movies=["Inception"])
    user_b = make_user(events=["festival"], movies=["Matrix"])
    shared = get_shared_interests(user_a, user_b)
    assert shared["events"] == []
    assert shared["movies"] == []


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])
