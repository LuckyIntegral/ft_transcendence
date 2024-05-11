DB_FOLDER = ./data
STATIC_FOLDER = ./srcs/staticfiles
CACHE_FOLDER = ./srcs/pingpong/__pycache__ ./srcs/transcedence/__pycache__
MIGRATION_FOLDER = ./srcs/pingpong/migrations
PICTURES_FOLDER = ./srcs/media/pictures

run:
	@docker-compose up -d --build

debug:
	@docker-compose up --build

stop:
	@docker-compose down

clean:
	@docker-compose down
	@docker system prune -f
	@docker volume prune -f
	@docker network prune -f
	@docker image prune -f
	@docker container prune -f

rmsocket:
	@docker volume rm ft_transcendence_socket_volume

cleandb:
	@docker volume rm $(shell docker volume ls -q)

fclean: clean
	@docker rmi -f $(shell docker images -q)
	@docker volume rm $(shell docker volume ls -q)
	@rm -rf $(PICTURES_FOLDER)/*
	@rm -rf $(STATIC_FOLDER)
	@rm -rf $(CACHE_FOLDER)
	@rm -rf $(MIGRATION_FOLDER)
