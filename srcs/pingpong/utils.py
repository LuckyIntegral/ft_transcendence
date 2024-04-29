from django.core.mail import send_mail

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
        'Your two-step verification code is: ' + token,
        'admin@localhost',
        [email],
        fail_silently=False,
    )