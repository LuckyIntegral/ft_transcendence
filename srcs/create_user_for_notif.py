import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "transcedence.settings")

import django
django.setup()
from django.core.files import File

from django.contrib.auth.models import User
from pingpong.models import UserProfile


if User.objects.filter(username='Notifications').exists():
    print('Notification user already exists')
    exit()

user = User.objects.create_user('Notifications', password=os.environ['NOTIFICATIONS_USER_PASSWORD'])
userprofile = UserProfile.objects.create(user=user)
with open('media/images/notif.jpg', 'rb') as f:
    userprofile.picture.save('notif.jpg', File(f))
with open('media/images/notifSmall.jpg', 'rb') as f:
    userprofile.pictureSmall.save('notifSmall.jpg', File(f))
userprofile.save()
