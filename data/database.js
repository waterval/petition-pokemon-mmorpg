let spicedPg = require("spiced-pg");
let database;
if (process.env.DATABASE_URL) {
    database = spicedPg(process.env.DATABASE_URL);
} else {
    database = spicedPg("postgres:postgres:postgres@localhost:5432/signatures");
}

exports.addUser = function addUser(firstname, lastname, email, password) {
    return database.query(
        `INSERT INTO users (firstname, lastname, email, password)
        VALUES ($1, $2, $3, $4)
        RETURNING id, firstname;`,
        [firstname, lastname, email, password]
    );
};

exports.addPersonalData = function addPersonalData(user_id, age, city, url) {
    return database.query(
        `INSERT INTO user_profiles (user_id, age, city, url)
        VALUES ($1, $2, $3, $4);`,
        [user_id, age, city, url]
    );
};

exports.addSignature = function addSignature(user_id, signature, created_at) {
    return database.query(
        `INSERT INTO signatures (user_id, signature, created_at)
        VALUES ($1, $2, $3)
        RETURNING id;`,
        [user_id, signature, created_at]
    );
};

exports.getHashedPassword = function getHashedPassword(email) {
    return database.query(
        `SELECT id, password, firstname, lastname
        FROM users
        WHERE email IN ($1);`,
        [email]
    );
};

exports.getSignatureUrl = function getSignatureUrl(user_id) {
    return database.query(
        `SELECT *
        FROM signatures
        WHERE user_id IN ($1);`,
        [user_id]
    );
};

exports.removeSignatureUrl = function removeSignatureUrl(user_id) {
    return database.query(
        `DELETE FROM signatures
        WHERE user_id IN ($1);`,
        [user_id]
    );
};

exports.getAmountSigners = function getAmountSigners() {
    return database.query(
        `SELECT COUNT(*)
        FROM signatures;`
    );
};

exports.getUserData = function getUserData(user_id) {
    return database.query(
        `SELECT signatures.id, signatures.user_id, users.firstname, users.lastname, users.email, user_profiles.age, user_profiles.city, user_profiles.url
        FROM signatures
        JOIN users
        ON signatures.user_id = users.id
        FULL OUTER JOIN user_profiles
        ON signatures.user_id = user_profiles.user_id
        WHERE signatures.user_id = ($1);`,
        [user_id]
    );
};

exports.updateUsersDataWithPassword = function updateUsersDataWithPassword(
    user_id,
    firstname,
    lastname,
    email,
    password
) {
    return database.query(
        `UPDATE users
        SET firstname = ($2),
        lastname = ($3),
        email = ($4),
        password = ($5)
        WHERE id = ($1);`,
        [user_id, firstname, lastname, email, password]
    );
};

exports.updateUsersDataWithoutPassword = function updateUsersDataWithoutPassword(
    id,
    firstname,
    lastname,
    email
) {
    return database.query(
        `UPDATE users
        SET firstname = ($2), lastname = ($3), email = ($4)
        WHERE id = ($1);`,
        [id, firstname, lastname, email]
    );
};

exports.updateUserProfilesData = function updateUserProfilesData(
    user_id,
    age,
    city,
    url
) {
    return database.query(
        `INSERT INTO user_profiles (user_id, age, city, url)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id)
        DO UPDATE SET age = ($2), city = ($3), url = ($4);`,
        [user_id, age, city, url]
    );
};

exports.getAllSupporters = function getAllSupporters() {
    return database.query(
        `SELECT signatures.id, signatures.user_id, users.firstname, users.lastname, user_profiles.age, user_profiles.city, user_profiles.url
        FROM signatures
        JOIN users
        ON signatures.user_id = users.id
        FULL OUTER JOIN user_profiles
        ON signatures.user_id = user_profiles.user_id;`
    );
};

exports.getCitySupporters = function getCitySupporters(city) {
    return database.query(
        `SELECT signatures.id, signatures.user_id, users.firstname, users.lastname, user_profiles.age, user_profiles.city, user_profiles.url
        FROM signatures
        JOIN users
        ON signatures.user_id = users.id
        FULL OUTER JOIN user_profiles
        ON signatures.user_id = user_profiles.user_id
        WHERE LOWER(city) = LOWER($1);`,
        [city]
    );
};
