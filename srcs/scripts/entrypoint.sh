until PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c '\q'; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

openssl req -x509 -newkey rsa:4096 -keyout /etc/nginx/ssl/key.pem -out /etc/nginx/ssl/cert.pem -days 365 -nodes -subj '/CN=10.14.5.2'

python manage.py makemigrations
python manage.py makemigrations pingpong
python manage.py makemigrations rest_framework_simplejwt

python manage.py migrate
python manage.py collectstatic --noinput
# python manage.py runserver 0.0.0.0:8000
python create_user_for_notif.py
daphne -u /tmp/daphne.sock transcedence.asgi:application
chmod 777 /tmp/daphne.sock
