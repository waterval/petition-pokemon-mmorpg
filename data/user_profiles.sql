CREATE TABLE user_profiles(
id SERIAL PRIMARY KEY,
user_id INT REFERENCES users(id) UNIQUE,
age INT,
city VARCHAR(100),
url VARCHAR(300)
);
