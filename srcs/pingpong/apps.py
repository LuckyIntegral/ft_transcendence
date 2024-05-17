""" This file is used to configure the pingpong app. """

from django.apps import AppConfig


class PingpongConfig(AppConfig):
    """This class is used to configure the pingpong app.
    It is used to define the name of the app.
    """

    default_auto_field = "django.db.models.BigAutoField"
    name = "pingpong"
