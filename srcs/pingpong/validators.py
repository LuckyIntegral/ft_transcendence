""" Validators for the pingpong app. """

from collections import Counter
import re
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.state import token_backend
from rest_framework_simplejwt.authentication import InvalidToken, TokenError


class UppercaseValidator:
    """Validator class that holds a single method validate"""

    def validate(self, password, user=None):
        """Validate whether the password contains at least 1 uppercase letter."""
        if not re.search("[A-Z]", password):
            raise ValidationError("Password must contain at least 1 uppercase letter.")


class LowercaseValidator:
    """Validator class that holds a single method validate"""

    def validate(self, password, user=None):
        """Validate whether the password contains at least 1 lowercase letter."""
        if not re.search("[a-z]", password):
            raise ValidationError("Password must contain at least 1 lowercase letter.")


class NumberValidator:
    """Validator class that holds a single method validate"""

    def validate(self, password, user=None):
        """Validate whether the password contains at least 1 number."""
        if not re.search("\d", password):
            raise ValidationError("Password must contain at least 1 number.")


class SpecialCharacterValidator:
    """Validator class that holds a single method validate"""

    def validate(self, password, user=None):
        """Validate whether the password contains at least 1 special character."""
        if not re.search("[^A-Za-z0-9]", password):
            raise ValidationError("Password must contain at least 1 special character.")


class RepeatableCharacterValidator:
    """Validator class that holds a single method validate"""

    def validate(self, password, user=None):
        """Validate whether the password contains any character more than 3 times."""
        counter_chars = Counter(password)
        if len(counter_chars) == 0:
            raise ValidationError("Password must contain at least 1 character.")
        if counter_chars.most_common(1)[0][1] > 3:
            raise ValidationError("Password must not contain any character more than 3 times.")


class EmailValidator:
    """Validator class that holds a single method validate"""

    def validate(self, email, user=None):
        """Validate whether the email is a valid email address.
        The email must contain an '@' and a '.'.
        Example: '<name>@<domain>.<tld>'
        """
        if not re.match(r"^\w+@\w+\.\w+$", email):
            raise ValidationError("Invalid email address.")


class JWTTokenValidator:
    """Validator class that holds a single method validate"""

    def validate(self, token):
        """Validate whether the token is a valid JWT token.
        The token must start with 'Bearer'.
        Example: 'Bearer <token>'.
        """
        if not token:
            raise ValidationError("Token is required.")
        try:
            token_type, token_key = token.split(" ")
            if token_type.lower() != "bearer":
                raise ValidationError("Token is invalid.")
            UntypedToken(token_key)
        except (InvalidToken, TokenError) as e:
            raise ValidationError(f"Token is invalid: {str(e)}")
        return token_key


class UsernamePasswordValidator:
    """Validator class that holds a single method validate"""

    def validate(self, username, password):
        """Validate whether the username and password are correct and the password matches
        the username password in the database.
        """
        if not username:
            raise ValidationError("Please provide a username.")
        if not password:
            raise ValidationError("Please provide a password.")
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise ValidationError("Username or password is incorrect.")
        if not user.check_password(password):
            raise ValidationError("Username or password is incorrect.")
        return user

class UsernameValidator:
    """Validator class that holds a single method validate"""

    def validate(self, username):
        """Validate whether the username is a valid username.
        The username must contain only alphanumeric characters.
        """
        if not username.isalnum():
            raise ValidationError("Username must contain only alphanumeric characters.")