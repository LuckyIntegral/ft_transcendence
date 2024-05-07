FROM python:3.10.10

RUN apt-get update && apt-get install -y postgresql-client

ENV PYTHONUNBUFFERED 1

RUN mkdir /code
WORKDIR /code

COPY requirements.txt /code/
RUN pip install --upgrade pip
RUN pip install -r requirements.txt
RUN pip install daphne

COPY . /code/

RUN rm Dockerfile


RUN chmod 777 ./scripts/entrypoint.sh

#RUN bash entrypoint.sh