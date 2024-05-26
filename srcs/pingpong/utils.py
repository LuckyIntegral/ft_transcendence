from django.core.mail import send_mail
from rest_framework_simplejwt.state import token_backend
from django.contrib.auth.models import User
from django.db.models import Q
from io import BytesIO
from django.core.files.base import ContentFile
from PIL import Image
from web3 import Web3
from django.conf import settings
from eth_account import Account
import asyncio
import uuid


def sendVerificationEmail(email, token):
    send_mail(
        "Email Verification",
        "Verify your email address by clicking the link below: http://localhost:8080/verify-email?token=" + token,
        "admin@localhost",
        [email],
        fail_silently=False,
    )


def sendTwoStepVerificationEmail(email, code):
    send_mail(
        "Two-Step Verification",
        "Your two-step verification code is: " + code,
        "admin@localhost",
        [email],
        fail_silently=False,
    )


def sendPasswordResetEmail(email, token):
    send_mail(
        "Password Reset",
        "Reset your password by clicking the link below: http://localhost:8080/reset-password/?token=" + token,
        "admin@localhost",
        [email],
        fail_silently=False,
    )


def getUserFromToken(token_key):
    token = token_backend.decode(token_key)
    user_id = token["user_id"]
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        raise ValidationError("User does not exist.")
    return user


def getCompressedPicture(image):
    image = image.convert("RGB")
    compressedImage = BytesIO()
    image.save(compressedImage, format="JPEG", quality=50)
    compressedImageFile = ContentFile(compressedImage.getvalue())
    return compressedImageFile


def userDirectoryPath(instance, filename):
    return "pictures/{0}/{1}".format(instance.user.username, filename)


# tournamentName: probably tournamentId and players: dict {playerNickname: player's place}
async def blockChainCreateGame(tournamentId, players):
    if len(players) == 0:
        return None
    web3 = Web3(Web3.HTTPProvider(settings.WEB3_PROVIDER))

    private_key = settings.WEB3_PRIVATE_KEY
    account = Account.from_key(private_key)

    web3.eth.defaultAccount = account.address

    contractAddress = settings.WEB3_CONTRACT_ADDRESS
    contractAbi = settings.WEB3_CONTRACT_ABI
    contract = web3.eth.contract(address=contractAddress, abi=contractAbi)

    nonce = web3.eth.get_transaction_count(account.address)

    playersNames = []
    playersPlaces = []
    for player in players.items():
        playersNames.append(player[0])
        playersPlaces.append(player[1])

    txn_dict = contract.functions.createGame(tournamentId, playersNames, playersPlaces).build_transaction(
        {
            "chainId": settings.WEB3_CHAIN_ID,
            "gas": 700000,
            "gasPrice": web3.to_wei("50", "gwei"),
            "nonce": nonce,
        }
    )
    signed_txn = web3.eth.account.sign_transaction(txn_dict, private_key)
    result = web3.eth.send_raw_transaction(signed_txn.rawTransaction)
    receipt = web3.eth.wait_for_transaction_receipt(result)
    logs = contract.events.GameCreated().get_logs(fromBlock=receipt["blockNumber"], toBlock=receipt["blockNumber"])
    for log in logs:
        if log["event"] == "GameCreated":
            gameId = log["args"]["gameId"]
    # instead of returning should update db to set gameId for the tournament
    return gameId

def create_chat_with_notification_user(user):
    from pingpong.models import Chat, Block
    try:
        notification_user = User.objects.get(username="Notifications")
    except User.DoesNotExist:
        return
    try:
        chat = Chat.objects.get(
            Q(userOne=user, userTwo=notification_user)
            | Q(userOne=notification_user, userTwo=user)
        )
    except Chat.DoesNotExist:
        chatToken = generateToken()
        while Chat.objects.filter(token=chatToken).exists():
            chatToken = generateToken()
        chat = Chat.objects.create(userOne=user, userTwo=notification_user, token=chatToken)
        chat.save()
        block = Block.objects.create(blocker=notification_user, blocked=user)

def generateToken():
    return str(uuid.uuid4())
