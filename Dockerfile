FROM node:21-alpine as build

# Install dependencies first, to save time later.

WORKDIR /source/fe
COPY ./frontend/package.json /source/fe/package.json
COPY ./frontend/package-lock.json /source/fe/package-lock.json
RUN npm install

WORKDIR /source/be
COPY ./backend/package.json /source/be/package.json
COPY ./backend/package-lock.json /source/be/package-lock.json
RUN npm install

WORKDIR /source/fe
COPY ./frontend /source/fe/
RUN npm run build

WORKDIR /source/be
COPY ./backend /source/be/
RUN npm run build

EXPOSE 3000

CMD [ "npm", "run", "dev", "--", "--host"]

FROM node:21-alpine AS serve

ARG NODE_ENV=production

WORKDIR /dash

COPY --from=build /source/be/package.json /dash/package.json  
COPY --from=build /source/be/package-lock.json /dash/package-lock.json 
RUN npm install

COPY --from=build /source/be/dist /dash
COPY --from=build /source/fe/dist /dash/frontend

EXPOSE 8080

CMD [ "node", "/dash/server.js" ]

