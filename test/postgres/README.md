# Postgres / Docker setup for automated testing

For some of the automated tests, it is necessary to have a local Postgres server running on port 5433.

There are two options for this.

## Option 1: Using Docker to spin up a PostgreSQL instance (recommended)

To run this option, first you need to install Docker on your system. The Docker website is a good source for installation tutorials depending on operating system.

After you have Docker installed (version 20.10.8 or later - I've found 20.10.7 has a bug when removing volumes), you can do the following:

1. `cd` to `test/postgres`.
2. Run command `docker compose up`.
3. Leave the terminal open and run your tests. Once you're done, press CTRL + C to stop the containers.
4. If you want, you can keep the volumes to get a faster startup next time. If you want to clean everything up (delete the postgres container and volume), run `docker compose rm -v` on the `test/postgres` directory. Confirm that you are removing the correct containers (should be postgres-db-1).

## Option 2: Installing PostgreSQL directly (not recommended)

You can go to the PostgreSQL website and download the latest version of Postgres, then install it but change the port from 5432 to 5433. Also, change the 'postgres' user password to 'unittest'.
