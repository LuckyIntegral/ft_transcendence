until PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c '\q'; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

python manage.py makemigrations
python manage.py makemigrations pingpong
python manage.py makemigrations rest_framework_simplejwt

python manage.py migrate
python manage.py collectstatic --noinput
# python manage.py runserver 0.0.0.0:8000
daphne -u /tmp/daphne.sock transcedence.asgi:application
chmod 777 /tmp/daphne.sock
