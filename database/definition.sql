CREATE TABLE rules (
	"id" SERIAL NOT NULL PRIMARY KEY,
	"description" VARCHAR(255) NOT NULL,
	"yaml_file" JSON NOT NULL,
	"created" TIMESTAMP NOT NULL DEFAULT NOW(),
	"last_modified" TIMESTAMP NOT NULL DEFAULT NOW(),
	"severity" INT NOT NULL DEFAULT 0,
	"category" VARCHAR(32) NOT NULL DEFAULT 'GENERAL',
	"enabled" BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE users (
	"email" TEXT NOT NULL PRIMARY KEY,
	"github_username" TEXT NOT NULL UNIQUE,
	"password" TEXT NOT NULL, -- hashed bcrypt,
	"admin" BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE violations (
	"id" SERIAL NOT NULL PRIMARY KEY,
	"repo_name" VARCHAR(100) NOT NULL, -- GitHub max repo length
	"pull_url" TEXT NOT NULL,
	"file_path" TEXT NOT NULL,
	"line_number" INTEGER NOT NULL,
	"resource_name" VARCHAR(64) NOT NULL, -- Terraform max length
	"timestamp_found" TIMESTAMP NOT NULL DEFAULT NOW(),
	"timestamp_fixed" TIMESTAMP NULL,
	"rule_id" INTEGER NOT NULL,
	"github_username" TEXT NOT NULL,

	FOREIGN KEY ("rule_id") REFERENCES rules ("id")
);
CREATE INDEX violations_github_username_idx ON violations (github_username);
CREATE INDEX violations_repo_name_idx ON violations (repo_name);
CREATE INDEX violations_rule_id_idx ON violations (rule_id);
