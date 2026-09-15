# Restart guide (Windows production)

What runs on the Windows machine, in what order it has to start, and how to restart
each piece by hand. `start-portfolio.ps1` in the repository root does all of this in
one go; this page explains what it does so any step can be repeated on its own.

## What is running

| Part | How it runs | Listens on | Started by |
|---|---|---|---|
| Cloudflare DDNS updater | Docker Compose in `C:\Users\seank\cloudflare-ddns` | none | script step 1 |
| MySQL 8 | Windows service (`MySQL*`) | 3306 | script step 2 |
| Nginx Proxy Manager | Docker Compose in `C:\nginx-proxy-manager` | 80, 443, admin on 81 | script step 3 |
| Backend API | `dotnet run` in `portfolio-page-backend`, own PowerShell window | 5001 (https), 5000 (http) | script step 4 |
| Frontend | `npx serve -s build -l 3000` in `portfolio-page`, own PowerShell window | 3000 | script step 5 |

Nginx Proxy Manager terminates TLS for `sean-keane.com`, forwards `/api` to
`https://localhost:5001`, and everything else to `http://localhost:3000`.

Docker Desktop has to be running before steps 1 and 3. The script checks and stops with
a message if it is not.

## Full restart

1. Sign in to the Windows machine and make sure Docker Desktop is running.
2. Open PowerShell in `C:\Users\seank\Documents\code\Software_Engineering_Capstone`.
3. Run `.\start-portfolio.ps1`.
4. The script leaves two extra PowerShell windows open, one for the backend and one for
   the frontend. Leave them open; closing one stops that part of the site.
5. Run `.\scripts\smoke.ps1` and check that every line prints `ok`.

## Restarting one part

Backend only:

1. Close the backend PowerShell window (or press Ctrl+C in it).
2. Open a new PowerShell window and run:

   ```
   cd C:\Users\seank\Documents\code\Software_Engineering_Capstone\portfolio-page-backend
   dotnet run
   ```

Frontend only:

1. Close the frontend PowerShell window.
2. Open a new PowerShell window and run:

   ```
   cd C:\Users\seank\Documents\code\Software_Engineering_Capstone\portfolio-page
   npm run build
   npx serve -s build -l 3000
   ```

   The build step is only needed when the code has changed.

MySQL:

```
Restart-Service MySQL80
```

The service name may differ; `Get-Service MySQL*` lists it.

Nginx Proxy Manager:

```
cd C:\nginx-proxy-manager
docker compose restart
```

Cloudflare DDNS:

```
cd C:\Users\seank\cloudflare-ddns
docker compose restart
```

## Checking health

- `netstat -an | Select-String ":5001.*LISTENING"` shows the backend is up.
- `netstat -an | Select-String ":3000.*LISTENING"` shows the frontend is up.
- `.\scripts\smoke.ps1` checks both through HTTP.
- `.\scripts\smoke.ps1 -Api https://sean-keane.com -Web https://sean-keane.com` checks
  the public path through Cloudflare and Nginx.
- Backend logs are written to `portfolio-page-backend\logs\log-YYYYMMDD.txt`.
- The Nginx Proxy Manager admin page is at `http://localhost:81`.

## After a reboot

Nothing starts automatically except the MySQL service and, if it is set to start at
login, Docker Desktop. Run the full restart above. Making the whole stack come back on
its own is Phase 7 work.

## Known rough edges

- The environment is `Development` until Phase 2, so API errors show developer pages.
  Nginx only forwards `/api`, so Swagger is not reachable from outside.
- Ports 5001 and 3000 are only bound on localhost. Only Nginx is exposed by the router.
- The startup script has the repository path hardcoded. Change `$root` at the top if the
  checkout moves.
