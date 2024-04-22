DB_FOLDER = ./data
STATIC_FOLDER = ./srcs/staticfiles

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
fclean: clean
	@docker rmi -f $(shell docker images -q)
	@rm -rf $(DB_FOLDER)
	@rm -rf $(STATIC_FOLDER)
