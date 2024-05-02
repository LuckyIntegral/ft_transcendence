from django.core.mail import send_mail
from rest_framework_simplejwt.state import token_backend
from django.contrib.auth.models import User
from io import BytesIO
from django.core.files.base import ContentFile
from PIL import Image

def sendVerificationEmail(email, token):
    send_mail(
        'Email Verification',
        'Verify your email address by clicking the link below: http://localhost:8000/verify-email?token=' + token,
        'admin@localhost',
        [email],
        fail_silently=False,
    )

def sendTwoStepVerificationEmail(email, code):
    send_mail(
        'Two-Step Verification',
        'Your two-step verification code is: ' + code,
        'admin@localhost',
        [email],
        fail_silently=False,
    )

def sendPasswordResetEmail(email, token):
    send_mail(
        'Password Reset',
        'Reset your password by clicking the link below: http://localhost:8000/reset-password/?token=' + token,
        'admin@localhost',
        [email],
        fail_silently=False,
    )

def getUserFromToken(token_key):
    token = token_backend.decode(token_key)
    user_id = token['user_id']
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        raise ValidationError('User does not exist.')
    return user

def getCompressedPicture(image):
    image = image.convert('RGB')
    compressedImage = BytesIO()
    image.save(compressedImage, format='JPEG', quality=50)
    compressedImageFile = ContentFile(compressedImage.getvalue())
    return compressedImageFile

def userDirectoryPath(instance, filename):
    return 'pictures/{0}/{1}'.format(instance.user.username, filename)