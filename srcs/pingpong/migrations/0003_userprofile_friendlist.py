# Generated by Django 3.2.25 on 2024-04-27 18:19

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pingpong', '0002_auto_20240426_1655'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='friendList',
            field=models.ManyToManyField(blank=True, related_name='_pingpong_userprofile_friendList_+', to='pingpong.UserProfile'),
        ),
    ]
