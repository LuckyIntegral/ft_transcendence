from django.core.exceptions import ValidationError
from collections import Counter
import re
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.state import token_backend
from rest_framework_simplejwt.authentication import InvalidToken, TokenError
from django.contrib.auth.models import User

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
		if (len(counterChars) == 0):
			raise ValidationError('Password must contain at least 1 character.')
		if counterChars.most_common(1)[0][1] > 3:
			raise ValidationError('Password must not contain any character more than 3 times.')

	def get_help_text(self):
		return 'Password must not contain any character more than 3 times.'

class PhoneNumberValidator:
	def validate(self, phoneNumber, user=None):
		if not phoneNumber:
			return ValidationError('Phone number is required.')
		if not re.match(r'^\+?1?\d{9,15}$', phoneNumber):
			raise ValidationError('Phone number must be between 9 and 15 digits.')

	def get_help_text(self):
		return 'Phone number must be between 9 and 15 digits.'

class EmailValidator:
	def validate(self, email, user=None):
		if not re.match(r'^\w+@\w+\.\w+$', email):
			raise ValidationError('Invalid email address.')

	def get_help_text(self):
		return 'Invalid email address.'

class JWTTokenValidator:
	def validate(self, token):
		if not token:
			raise ValidationError('Token is required.')
		try:
			tokenType, tokenKey = token.split(' ')
			if (tokenType.lower() != 'bearer'):
				raise ValidationError('Token is invalid.')
			UntypedToken(tokenKey)
		except (InvalidToken, TokenError) as e:
			raise ValidationError(f'Token is invalid: {str(e)}')
		
		token = token_backend.decode(tokenKey)
		user_id = token['user_id']
		try:
			user = User.objects.get(id=user_id)
		except User.DoesNotExist:
			raise ValidationError('User does not exist.')
		return user
	
	def get_help_text(self):
		return 'Token is invalid.'
		
		