FROM node:lts-alpine
RUN npm install -g serve
RUN mkdir -p /app/view/v2/assets
COPY dist/index.html /app
COPY dist/assets /app/view/v2/assets    
EXPOSE 80
CMD ["serve", "-s", "-l", "80", "/app"]
