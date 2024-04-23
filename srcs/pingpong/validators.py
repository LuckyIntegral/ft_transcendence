from django.core.exceptions import ValidationError
from collections import Counter
import re

class UppercaseValidator:
    def validate(self, password, user=None):
        if not re.search('[A-Z]', password):
            raise ValidationError('Password must contain at least 1 uppercase letter.')

class LowercaseValidator:
    def validate(self, password, user=None):
        if not re.search('[a-z]', password):
            raise ValidationError('Password must contain at least 1 lowercase letter.')

class NumberValidator:
    def validate(self, password, user=None):
        if not re.search('\d', password):
            raise ValidationError('Password must contain at least 1 number.')

class SpecialCharacterValidator:
    def validate(self, password, user=None):
        if not re.search('[^A-Za-z0-9]', password):
            raise ValidationError('Password must contain at least 1 special character.')

class RepeatableCharacterValidator:
    def validate(self, password, user=None):
        counterChars = Counter(password)
        if counterChars.most_common(1)[0][1] > 3:
            raise ValidationError('Password must not contain any character more than 3 times.')

    def get_help_text(self):
        return 'Password must not contain any character more than 3 times.'