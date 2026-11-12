# Portfolio: Spring Boot + Angular

## Run in development (two terminals)
1. `cd backend && mvn spring-boot:run`  (http://localhost:8080)
2. `cd frontend && npm install && npm start`  (http://localhost:4200)

## Edit your content
Change `backend/src/main/resources/profile-en.json` and `profile-ar.json`. No frontend change needed.

## Contact messages
Saved in `backend/data/portfolio` (H2 file DB).
Read them: GET `/api/messages` with header `X-Admin-Key: <your key>`. Set the key with the `ADMIN_KEY` env var.

## One-jar production build
1. `cd frontend && npm run build`
2. Copy everything inside `frontend/dist/portfolio/browser` into `backend/src/main/resources/static`
3. `cd backend && mvn package && ADMIN_KEY=your-long-key java -jar target/portfolio-1.0.0.jar`
