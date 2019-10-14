# Petition for a Pokémon MMORPG

Petition for a Pokémon MMORPG allows everyone to support a great cause. They can create a free account and sign a petition by drawing their signature. After collecting one million signatures, the Pokémon Company will be politely requested to create a MMORPG of the Pokémon universe.

## Preview

<p align="center">
<img src="/public/images/petition-pokemon-mmorpg-preview.png" alt="Preview of Petition for a Pokémon MMORPG">
</p>

## Features

-   Create a free account
-   Login/logout to an account
-   Draw/remove signature
-   Share/edit profile information
-   View all supporters of the petition
-   View supporters of a specific city

## Technology

-   HTML
-   CSS
-   JavaScript
-   jQuery
-   Canvas
-   Node
-   Express
-   Express Handlebars
-   Cookie Session
-   Body Parser
-   Csurf
-   Bcrypt
-   Postgres

## Code Example

```
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
```

## Credits

The idea for this project was inspired by David Friedman of Spiced Academy.

## Contribute

Contribution is much appreciated. Please let me know about any bugs and ideas for improvements.
