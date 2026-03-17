  Quick look via command line (what I just ran):
  docker exec unwind-db-1 psql -U unwind -d unwind -c "SELECT title, source FROM activities LIMIT 10;"

  Interactive SQL session (you can type queries freely):
  docker exec -it unwind-db-1 psql -U unwind -d unwind

  Then you're in the psql shell — type SQL queries, \dt to list tables, \d activities to see a table's columns, \q to quit.

  Or use a GUI — if you prefer something visual, you could use:
  - pgAdmin (comes as a Docker image, heavyweight)
  - DBeaver (free desktop app, nice for browsing tables)
  - The Database tab in VS Code (with the PostgreSQL extension)

  Connection details for any of them:
  Host: localhost
  Port: 5555
  User: unwind
  Password: unwind
  Database: unwind

  The interactive psql session is quickest for a quick look. A GUI like DBeaver is nicer if you want to browse around and see the   
  data in a table view.