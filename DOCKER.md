
# Local

## build

`docker build . -t scatola:<version>`

## run

`docker run --rm -e SESSION_SECRET="test" -e ENCRYPTION_KEY="your-super-secret" -v $PWD/prisma/data.db:/data/sqlite.db -p 8080:8080 scatola:latest`
