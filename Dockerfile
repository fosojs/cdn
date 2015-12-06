FROM node:5-onbuild

MAINTAINER Zoltan Kochan, zoltan.kochan@gmail.com

# Install packages
COPY package.json /src/package.json
RUN cd /src; npm install

# Make everything available for start
COPY . /src

EXPOSE 9595
CMD ["node", "/src/app.js"]
