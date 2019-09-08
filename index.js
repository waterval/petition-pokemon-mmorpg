const express = require("express");
const app = express();
const handlebars = require("express-handlebars");
const cookieSession = require("cookie-session");
const bodyParser = require("body-parser");
const csurf = require("csurf");
const database = require("./data/database");
const bcrypt = require("./utilities/bcrypt");
const {
    userLoggedOut,
    userLoggedIn,
    userSigned
} = require("./utilities/userflow");

app.engine(
    "handlebars",
    handlebars({
        defaultLayout: "main"
    })
);

app.set("view engine", "handlebars");

app.use(express.static("./public"));

app.use(
    bodyParser.urlencoded({
        extended: false
    })
);

app.use(
    cookieSession({
        secret: `$iE3l@`,
        maxAge: 1000 * 60 * 60 * 24 * 7
    })
);

app.use(csurf());

app.use((request, response, next) => {
    response.locals.csrfToken = request.csrfToken();
    response.set("x-frame-options", "deny");
    response.locals.userId = request.session.userId;
    response.locals.userFirstName = request.session.userFirstName;
    database.getAmountSigners().then(results => {
        const amountSigned = results.rows[0].count;
        response.locals.amountSigned = amountSigned;
        const signaturesNeeded = 1000000 - amountSigned;
        response.locals.amountNeeded = signaturesNeeded;
    });
    next();
});

app.get("/favicon.ico", (req, res) => res.status(204));

app.get("/", userLoggedOut, (request, response) => {
    response.redirect("/petition/register");
});

app.get("/petition/register", userLoggedOut, function(request, response) {
    response.render("register", {});
});

app.post("/petition/register", userLoggedOut, function(request, response) {
    const userFirstName = request.body.firstname;
    const userLastName = request.body.lastname;
    const userEmail = request.body.email;
    const userPassword = request.body.password;
    if (
        request.body.firstname &&
        request.body.lastname &&
        request.body.email &&
        request.body.password
    ) {
        bcrypt
            .hashPassword(userPassword)
            .then(function(hashedPassword) {
                return database.addUser(
                    userFirstName,
                    userLastName,
                    userEmail,
                    hashedPassword
                );
            })
            .then(function(results) {
                const userId = results.rows[0].id;
                request.session.userId = userId;
                const userFirstName = results.rows[0].firstname;
                request.session.userFirstName = userFirstName;
                request.session.userLoggedIn = true;
                response.redirect("/petition/introduction");
            })
            .catch(function(error) {
                console.log("error in post /petition/register: ", error);
            });
    } else {
        response.render("register", {
            registerFailed: true
        });
    }
});

app.get("/petition/login", userLoggedOut, function(request, response) {
    response.render("login", {});
});

app.post("/petition/login", userLoggedOut, function(request, response) {
    const userEmail = request.body.email;
    const userPassword = request.body.password;
    let userId, userFirstName, userLastName;
    database
        .getHashedPassword(userEmail)
        .then(hashedPassword => {
            const databasePassword = hashedPassword.rows[0].password;
            userId = hashedPassword.rows[0].id;
            userFirstName = hashedPassword.rows[0].firstname;
            userLastName = hashedPassword.rows[0].lastname;
            return bcrypt.checkPassword(userPassword, databasePassword);
        })
        .then(passwordsMatch => {
            if (passwordsMatch) {
                request.session.userId = userId;
                request.session.userFirstName = userFirstName;
                request.session.userLastName = userLastName;
                request.session.userLoggedIn = true;
                return database.getSignatureUrl(userId);
            } else {
                response.render("login", {
                    loginFailed: true
                });
            }
        })
        .then(userHasSigned => {
            if (!userHasSigned.rows.length) {
                response.redirect("/petition/sign");
            } else {
                request.session.userSigned = true;
                response.redirect("/petition/gratitude");
            }
        })
        .catch(error => {
            console.log("error in post /petition/login: ", error);
        });
});

app.get("/petition/introduction", userLoggedIn, function(request, response) {
    response.render("introduction", {});
});

app.post("/petition/introduction", userLoggedIn, function(request, response) {
    const userId = request.session.userId;
    let userAge;
    if (request.body.age) {
        userAge = request.body.age;
    }
    const userCity = request.body.city;
    let userUrl = request.body.url;
    if (!userUrl.startsWith("http://" || "https://")) {
        userUrl = `http://${userUrl}`;
    }
    database
        .addPersonalData(userId, userAge, userCity, userUrl)
        .then(results => {
            console.log("results in post /petition/introduction", results);
            response.redirect("/petition/sign");
        })
        .catch(error => {
            console.log("error in post /petition/introduction: ", error);
        });
});

app.get("/petition/sign", userLoggedIn, function(request, response) {
    response.render("sign", {});
});

app.post("/petition/sign", userLoggedIn, (request, response) => {
    const userId = request.session.userId;
    const userSignature = request.body.signature;
    const userTime = "now()";
    if (userSignature.length > 0) {
        database
            .addSignature(userId, userSignature, userTime)
            .then(results => {
                console.log("results in post /petition/sign", results);
                request.session.userSigned = true;
                response.redirect("/petition/gratitude");
            })
            .catch(error => {
                console.log("error in post /petition/sign: ", error);
            });
    } else {
        response.render("sign", {
            notSigned: true
        });
    }
});

app.get("/petition/gratitude", userSigned, function(request, response) {
    const userId = request.session.userId;
    database
        .getSignatureUrl(userId)
        .then(results => {
            const userSignature = results.rows[0].signature;
            response.render("gratitude", {
                signatureUrl: userSignature
            });
        })
        .catch(error => {
            console.log("error in get /petition/gratitude:", error);
        });
});

app.post("/petition/gratitude", userSigned, function(request, response) {
    const userId = request.session.userId;
    database
        .removeSignatureUrl(userId)
        .then(results => {
            console.log("results in get /petition/gratitude", results);
            delete request.session.userSigned;
            response.redirect("/petition/sign");
        })
        .catch(error => {
            console.log("error in post /petition/gratitude:", error);
        });
});

app.get("/petition/profile", userSigned, function(request, response) {
    const userId = request.session.userId;
    const profileUpdated = request.session.profileUpdated;
    delete request.session.profileUpdated;
    database
        .getUserData(userId)
        .then(results => {
            const userData = results.rows;
            response.render("profile", {
                userData: userData,
                profileUpdated: profileUpdated
            });
        })
        .catch(error => {
            console.log("error in get /petition/profile:", error);
        });
});

app.post("/petition/profile", userSigned, function(request, response) {
    const userId = request.session.userId;
    const userFirstName = request.body.firstname;
    const userLastName = request.body.lastname;
    const userEmail = request.body.email;
    let userAge;
    if (request.body.age) {
        userAge = request.body.age;
    }
    const userCity = request.body.city;
    let userUrl = request.body.url;
    if (!userUrl.startsWith("http://" || "https://")) {
        userUrl = `http://${userUrl}`;
    }
    const userChangesPassword = request.body.password;
    if (userChangesPassword) {
        bcrypt
            .hashPassword(userChangesPassword)
            .then(hashedPassword => {
                return database.updateUsersDataWithPassword(
                    userId,
                    userFirstName,
                    userLastName,
                    userEmail,
                    hashedPassword
                );
            })
            .catch(error => {
                console.log(
                    "error in post /petition/profile regarding password:",
                    error
                );
            });
    } else {
        database.updateUsersDataWithoutPassword(
            userId,
            userFirstName,
            userLastName,
            userEmail
        );
    }

    database
        .updateUserProfilesData(userId, userAge, userCity, userUrl)
        .then(results => {
            console.log(
                "results in post /petition/profile after database.updateUserProfilesData()",
                results
            );
            request.session.profileUpdated = true;
            response.redirect("/petition/profile");
        })
        .catch(error => {
            console.log(
                "error in post /petition/profile regarding profile data:",
                error
            );
        });
});

app.get("/petition/supporters", userSigned, function(request, response) {
    database
        .getAllSupporters()
        .then(results => {
            const dataAllSupporters = results.rows;
            response.render("supporters", {
                listAllSupporters: dataAllSupporters
            });
        })
        .catch(error => {
            console.log("error in get petition/supporters:", error);
        });
});

app.get("/petition/supporters/:cityName", userSigned, function(
    request,
    response
) {
    const cityName = request.params.cityName;
    database
        .getCitySupporters(cityName)
        .then(results => {
            const dataCitySupporters = results.rows;
            if (dataCitySupporters && dataCitySupporters.length) {
                response.render("location", {
                    cityName: cityName,
                    listCitySupporters: dataCitySupporters
                });
            } else {
                response.redirect("/petition/supporters");
            }
        })
        .catch(error => {
            console.log("error in get petition/supporters/:cityName:", error);
        });
});

app.get("/petition/logout", function(request, response) {
    request.session = null;
    response.redirect("/petition/register");
});

if (require.main == module) {
    app.listen(process.env.PORT || 8080, () =>
        console.log("petition app is listening")
    );
}
